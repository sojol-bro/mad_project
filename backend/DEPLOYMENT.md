# Azure Deployment Guidelines

This document provides instructions for deploying the production-grade ShopNest POS Elite backend on Microsoft Azure.

## 1. Services Architecture
- **Web Host**: Azure App Service (Linux Web App running Docker)
- **Database**: Supabase PostgreSQL (or Azure Database for PostgreSQL Flexible Server)
- **Cache & Task Queue Broker**: Azure Cache for Redis
- **Secrets & Configuration**: Azure Key Vault

---

## 2. Secrets Management (Azure Key Vault)
Secrets must never be stored in source code. 

1. Create an **Azure Key Vault** instance.
2. Store key credentials as secrets:
   - `SECRET-KEY`: Django production signing key
   - `DATABASE-URL`: Postgres connection string (`postgresql://<user>:<password>@<host>:<port>/<db>`)
   - `REDIS-URL`: Azure Redis connection string (`redis://:<password>@<host>:<port>/0`)
   - `SUPABASE-URL` / `SUPABASE-KEY`: For Storage signed URLs access.
3. Enable **System Assigned Managed Identity** on the Azure App Service.
4. Add an **Access Policy** in Key Vault granting the App Service Identity `Get` permissions for Secrets.
5. In App Service **Configuration**, reference the secrets directly using Key Vault references:
   ```env
   SECRET_KEY=@Microsoft.KeyVault(SecretUri=https://<your-vault>.vault.azure.net/secrets/SECRET-KEY/)
   DATABASE_URL=@Microsoft.KeyVault(SecretUri=https://<your-vault>.vault.azure.net/secrets/DATABASE-URL/)
   REDIS_URL=@Microsoft.KeyVault(SecretUri=https://<your-vault>.vault.azure.net/secrets/REDIS-URL/)
   ```

---

## 3. Docker Deployment on Azure App Service
1. Build the Docker image:
   ```bash
   docker build -t shopnest-pos-backend .
   ```
2. Tag and push to **Azure Container Registry (ACR)**:
   ```bash
   az acr login --name <acr_name>
   docker tag shopnest-pos-backend <acr_name>.azurecr.io/shopnest-pos-backend:latest
   docker push <acr_name>.azurecr.io/shopnest-pos-backend:latest
   ```
3. Set the App Service to pull the image from your ACR.
4. Set App Service Application Setting `WEBSITES_PORT` to `8000` or configure Nginx as a reverse proxy.

---

## 4. Database Migrations
Run Django migrations in the App Service startup command or via Azure DevOps / GitHub Actions pipeline:
```bash
python manage.py migrate --noinput
```
**Important**: For the initial deployment, since Supabase tables already exist, Django migrations should be run using `--fake-initial` or simply manage future migrations with standard `makemigrations` and `migrate`.
