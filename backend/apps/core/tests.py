import uuid
from decimal import Decimal
from datetime import date, timedelta
from django.urls import reverse
from django.core.cache import cache
from rest_framework import status
from rest_framework.test import APITestCase
from .models import Branch, CustomUser, Category, Product, Supplier, ProductBatch, Inventory, Sale, SaleItem

class CoreBackendTests(APITestCase):
    def setUp(self):
        # Clear cache before tests
        cache.clear()

        # Create Branches
        self.branch1 = Branch.objects.create(name="Branch North", location="New York")
        self.branch2 = Branch.objects.create(name="Branch South", location="Miami")

        # Create Users
        self.admin_user = CustomUser.objects.create_user(
            email="admin@shopnest.com",
            password="StrongPassword123!",
            name="Super Admin",
            role="admin"
        )
        self.manager_user1 = CustomUser.objects.create_user(
            email="manager1@shopnest.com",
            password="StrongPassword123!",
            name="Manager Branch 1",
            role="manager",
            branch=self.branch1
        )
        self.cashier_user1 = CustomUser.objects.create_user(
            email="cashier1@shopnest.com",
            password="StrongPassword123!",
            name="Cashier Branch 1",
            role="cashier",
            branch=self.branch1
        )
        self.cashier_user2 = CustomUser.objects.create_user(
            email="cashier2@shopnest.com",
            password="StrongPassword123!",
            name="Cashier Branch 2",
            role="cashier",
            branch=self.branch2
        )

        # Create Category
        self.category = Category.objects.create(name="Electronics")

        # Create Product
        self.product = Product.objects.create(
            name="Wireless Mouse",
            barcode="MOUSE12345",
            category=self.category,
            brand="Logitech",
            unit="pcs",
            cost_price=Decimal("10.00"),
            selling_price=Decimal("25.00"),
            min_stock_level=5
        )

        # Create Supplier
        self.supplier = Supplier.objects.create(name="Logitech Distributor", phone="12345678", email="dist@logi.com")

        # Create Batch for Branch 1
        self.batch1 = ProductBatch.objects.create(
            product=self.product,
            supplier=self.supplier,
            branch=self.branch1,
            batch_number="BAT-001",
            manufacturing_date=date.today() - timedelta(days=30),
            expiry_date=date.today() + timedelta(days=330),
            quantity_received=100,
            remaining_quantity=80,
            purchase_price=Decimal("10.00")
        )

        # Create Inventory for Branch 1
        self.inventory1 = Inventory.objects.create(
            product=self.product,
            branch=self.branch1,
            total_quantity=80
        )

    # --- Authentication Tests ---

    def test_jwt_login_successful_no_mfa(self):
        """
        Verify successful login and JWT retrieval.
        """
        url = reverse('auth-login')
        data = {
            "email": "cashier1@shopnest.com",
            "password": "StrongPassword123!"
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('access', response.data)
        self.assertIn('refresh', response.data)
        self.assertEqual(response.data['user']['email'], "cashier1@shopnest.com")

    def test_jwt_login_with_mfa_triggers_ticket(self):
        """
        If MFA is enabled, login should return an MFA ticket instead of JWT.
        """
        # Enable MFA in Redis for manager
        cache.set(f"mfa_enabled:{self.manager_user1.id}", True)

        url = reverse('auth-login')
        data = {
            "email": "manager1@shopnest.com",
            "password": "StrongPassword123!"
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data.get('mfa_required'))
        self.assertIn('ticket', response.data)
        self.assertNotIn('access', response.data)

    def test_mfa_verification_with_email_otp(self):
        """
        Verify that a valid Email OTP combined with MFA ticket returns authentication tokens.
        """
        cache.set(f"mfa_enabled:{self.manager_user1.id}", True)
        
        # 1. Login to get ticket
        login_url = reverse('auth-login')
        login_data = {"email": "manager1@shopnest.com", "password": "StrongPassword123!"}
        login_response = self.client.post(login_url, login_data, format='json')
        ticket = login_response.data['ticket']

        # 2. Get code from cache and verify
        otp_code = cache.get(f"email_otp:{self.manager_user1.id}")
        self.assertIsNotNone(otp_code)

        verify_url = reverse('auth-mfa-verify')
        verify_data = {
            "ticket": ticket,
            "code": otp_code,
            "method": "email"
        }
        verify_response = self.client.post(verify_url, verify_data, format='json')
        self.assertEqual(verify_response.status_code, status.HTTP_200_OK)
        self.assertIn('access', verify_response.data)

    # --- Role-Based Access Control & Isolation Tests ---

    def test_cashier_blocked_from_adding_product(self):
        """
        Cashier should be forbidden from creating products.
        """
        self.client.force_authenticate(user=self.cashier_user1)
        url = reverse('product-list')
        data = {
            "name": "New Keyboard",
            "barcode": "KEYBOARD99",
            "category": str(self.category.id),
            "selling_price": 50.00
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_branch_isolation_on_inventory(self):
        """
        Cashier of Branch 2 should NOT see inventory of Branch 1.
        """
        # Cashier 1 sees Branch 1 inventory
        self.client.force_authenticate(user=self.cashier_user1)
        url = reverse('inventory-list')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)

        # Cashier 2 sees empty results for Branch 1 inventory
        self.client.force_authenticate(user=self.cashier_user2)
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 0)

    # --- Sales Module & POS Transaction Tests ---

    def test_pos_sales_transaction_creation_and_inventory_deduction(self):
        """
        Verify that a POS sale creation correctly:
        - Calculates total amount, tax (15%), and applies discount
        - Deducts stock from the respective batch and inventory record
        - Automatically associates with the authenticated cashier
        """
        self.client.force_authenticate(user=self.cashier_user1)
        url = reverse('sale-list')

        # We will sell 5 items of product (selling price $25.00, discount $10.00)
        # Expected subtotal = 5 * 25.00 = 125.00
        # Expected tax = (125.00 - 10.00) * 0.15 = 17.25
        # Expected total = 125.00 - 10.00 + 17.25 = 132.25
        data = {
            "discount": "10.00",
            "payment_method": "Cash",
            "customer_name": "John Doe",
            "items": [
                {
                    "product": str(self.product.id),
                    "batch": str(self.batch1.id),
                    "quantity": 5,
                    "selling_price": "25.00"
                }
            ]
        }

        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        # Assert calculations
        self.assertEqual(Decimal(response.data['total_amount']), Decimal("132.25"))
        self.assertEqual(Decimal(response.data['tax']), Decimal("17.25"))
        self.assertEqual(response.data['cashier_name'], self.cashier_user1.name)

        # Assert stock deduction
        self.batch1.refresh_from_db()
        self.assertEqual(self.batch1.remaining_quantity, 75)

        self.inventory1.refresh_from_db()
        self.assertEqual(self.inventory1.total_quantity, 75)
