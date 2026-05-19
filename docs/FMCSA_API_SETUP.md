# FMCSA API Setup Guide

## Getting Your API Key

The FMCSA provides free API access to their carrier data. Follow these steps:

### 1. Register for FMCSA API Access

1. Visit: https://mobile.fmcsa.dot.gov/qc/Registration
2. Click **"Register"** to create a new account
3. Fill in your details:
   - **Name**: Your name or company name
   - **Email**: Valid email address
   - **Organization**: AuthorityMatch / Your Company
   - **Purpose**: Freight authority data analysis and matching platform

### 2. Request API Key

1. Log in to your FMCSA account
2. Navigate to **API Access** or **Developer Portal**
3. Click **"Request API Key"**
4. Describe your use case:
   ```
   Building a platform to match freight authorities with factoring 
   companies. Need read-only access to carrier census data including 
   DOT numbers, safety ratings, insurance status, and operating authority.
   ```
5. Submit the request

### 3. Receive API Key

- Approval typically takes **1-3 business days**
- You'll receive an email with your API key
- The key will look like: `abc123def456ghi789` (alphanumeric string)

### 4. Test Your API Key

Once you have your key, test it:

```bash
# Set the key in your environment
export FMCSA_API_KEY="your_api_key_here"

# Run the test script
node test-fmcsa-api.js
```

Or test manually with curl:

```bash
curl "https://mobile.fmcsa.dot.gov/qc/services/carriers/168450?webKey=$FMCSA_API_KEY"
```

## API Limits & Tiers

| Tier | Requests/Day | Best For |
|------|-------------|----------|
| **Free** | 1,000 | Testing, small-scale |
| **Standard** | 10,000 | Development, single state |
| **Enterprise** | 100,000+ | Production, multi-state |

For AuthorityMatch, you'll likely need **Standard** tier for initial data load, then **Free** tier for daily incremental updates.

## Available Endpoints

### Carrier Details
```
GET /carriers/{dotNumber}
```
Returns detailed info for a specific carrier.

### Carrier Search
```
GET /carriers?state=AR&size=100
```
Search carriers by state with pagination.

### Updated Carriers
```
GET /carriers?updatedSince=2024-01-01&size=1000
```
Get carriers updated since a date (for incremental sync).

### Safety Rating
```
GET /carriers/{dotNumber}/safer/safetyrating
```
Get safety rating details.

## Testing Without API Key

If you don't have an API key yet, you can:

1. **Use CSV data** (recommended for initial load):
   - Download from: https://www.fmcsa.dot.gov/sites/fmcsa.dot.gov/files/2024-05/FMCSA_Carrier_Census.zip
   - Process with: `node batch-ingest.js`

2. **Mock API for development**:
   ```bash
   # Create mock data from your CSV
   node process-csv-stream.js
   ```

## Troubleshooting

### 401 Unauthorized
- API key is invalid or expired
- Request a new key from FMCSA

### 429 Too Many Requests
- You've hit the rate limit
- Wait 24 hours or upgrade your tier

### 500 Server Error
- FMCSA API is down
- Try again later or use CSV fallback

### Empty Results
- Some endpoints return limited data for free tier
- Try different query parameters

## Next Steps

Once you have a working API key:

1. Add to GitHub Secrets for Actions:
   ```
   GitHub → Settings → Secrets → New secret
   Name: FMCSA_API_KEY
   Value: your_api_key
   ```

2. Test the sync engine:
   ```bash
   FMCSA_API_KEY=xxx node packages/data-pipeline/dist/sync-engine.js incremental
   ```

3. Schedule automated syncs via GitHub Actions

## Contact FMCSA

- **API Support**: https://mobile.fmcsa.dot.gov/qc/Help
- **Email**: FMCSA Tech Support via website
- **Documentation**: https://mobile.fmcsa.dot.gov/qc/resources

## Security Note

**Never commit your API key to Git!** Always use:
- Environment variables (`export FMCSA_API_KEY=...`)
- GitHub Secrets for CI/CD
- `.env` files (added to `.gitignore`)
