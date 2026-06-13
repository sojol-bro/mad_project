from celery import shared_task
from django.core.mail import send_mail
from django.db.models import F, Sum
from datetime import date, timedelta
from decimal import Decimal
from .models import Inventory, ProductBatch, Sale, Branch

@shared_task
def send_email_notifications(subject, message, recipient_list):
    """
    Asynchronously send email notifications.
    """
    send_mail(
        subject=subject,
        message=message,
        from_email="alerts@shopnestpos.com",
        recipient_list=recipient_list,
        fail_silently=True
    )
    return f"Sent email to {len(recipient_list)} recipients"

@shared_task
def check_low_stock():
    """
    Check if any inventory records have fallen below minimum stock level.
    """
    low_stock_records = Inventory.objects.filter(total_quantity__lt=F('product__min_stock_level')).select_related('product', 'branch')
    
    # Group warnings by branch to notify respective store managers
    branch_alerts = {}
    for inv in low_stock_records:
        branch = inv.branch
        if branch not in branch_alerts:
            branch_alerts[branch] = []
        branch_alerts[branch].append(f"{inv.product.name} (Qty: {inv.total_quantity}, Min Required: {inv.product.min_stock_level})")

    for branch, items in branch_alerts.items():
        # Retrieve all managers/admins of the branch
        managers = branch.users.filter(role__in=['manager', 'admin']).values_list('email', flat=True)
        if managers:
            items_str = "\n- ".join(items)
            subject = f"Low Stock Warning: {branch.name}"
            message = f"Hello Store Management,\n\nThe following products are low on stock:\n\n- {items_str}\n\nPlease update inventory."
            send_email_notifications.delay(subject, message, list(managers))
            
    return f"Processed stock check, generated {len(branch_alerts)} alerts"

@shared_task
def check_expiring_products():
    """
    Scan product batches expiring in the next 30 days.
    """
    expiry_limit = date.today() + timedelta(days=30)
    expiring_batches = ProductBatch.objects.filter(
        expiry_date__lte=expiry_limit, 
        remaining_quantity__gt=0
    ).select_related('product', 'branch')

    branch_alerts = {}
    for batch in expiring_batches:
        branch = batch.branch
        if branch not in branch_alerts:
            branch_alerts[branch] = []
        branch_alerts[branch].append(
            f"{batch.product.name} (Batch: {batch.batch_number}, Remaining Qty: {batch.remaining_quantity}, Expiry: {batch.expiry_date})"
        )

    for branch, items in branch_alerts.items():
        managers = branch.users.filter(role__in=['manager', 'admin']).values_list('email', flat=True)
        if managers:
            items_str = "\n- ".join(items)
            subject = f"Expiring Products Warning: {branch.name}"
            message = f"Hello Store Management,\n\nThe following product batches are expiring within 30 days:\n\n- {items_str}\n\nPlease take actions."
            send_email_notifications.delay(subject, message, list(managers))

    return f"Processed expiry scan, detected expiring batches for {len(branch_alerts)} branches"

@shared_task
def generate_sales_reports():
    """
    Periodical sales reports generation (mocked execution).
    """
    today = date.today()
    yesterday = today - timedelta(days=1)
    
    # Daily aggregation
    daily_sales = Sale.objects.filter(created_at__date=yesterday).aggregate(total=Sum('total_amount'))
    total_val = daily_sales.get('total') or Decimal('0.00')
    
    # Send daily summary to administrators
    admins = Branch.objects.first().users.filter(role='admin').values_list('email', flat=True)
    if admins:
        subject = f"Daily Sales Summary for {yesterday}"
        message = f"Total System Sales Generated: ${total_val:.2f}"
        send_email_notifications.delay(subject, message, list(admins))
        
    return f"Report generated: ${total_val:.2f}"

@shared_task
def daily_backup_verification():
    """
    Mock Celery task representing daily backup verification processes.
    """
    # Verify DB backups, connection health, and Redis state
    # Log outputs
    print("Daily database backup verification completed successfully.")
    return "Backup verification completed"
