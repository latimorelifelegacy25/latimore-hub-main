# Daily Google data pipeline

The `Daily Google analytics and business data` workflow runs at 11:23 UTC daily
(7:23 a.m. Eastern daylight time / 6:23 a.m. Eastern standard time). GitHub may
delay scheduled runs. Merge the workflow and collector onto the default branch
to enable scheduling. Public repositories may have schedules disabled after
60 days without repository activity; monitor the Actions page.

## Google setup

1. Use a Google Cloud project with the Google Analytics Data API and Business
   Profile Performance API enabled. Business Profile API access requires Google
   approval and usable quota; see the
   [prerequisites](https://developers.google.com/my-business/content/prereqs).
2. Configure an OAuth consent screen and OAuth client. Authorize a Google user
   with Viewer or higher access to the GA4 property and owner/manager access to
   every Business Profile location.
3. Obtain an **offline refresh token** using your own OAuth client and both scopes:
   `https://www.googleapis.com/auth/analytics.readonly` and
   `https://www.googleapis.com/auth/business.manage`.
   The latter scope is required by Google's performance API; this collector only
   reads data. Follow Google's
   [OAuth offline-access guide](https://developers.google.com/identity/protocols/oauth2/web-server#offline).
   For one-time setup, Google's OAuth Playground can use your own client credentials
   (settings → Use your own OAuth credentials; register
   `https://developers.google.com/oauthplayground` as a redirect URI). Select both
   scopes, authorize, exchange the authorization code, and store the refresh token
   directly in GitHub Secrets. Do not commit tokens or paste them into logs/chat.
   External consent apps in Testing generally issue refresh tokens that expire
   after seven days for these scopes. Configure the appropriate production/internal
   consent status and complete any required verification for unattended operation.

## GitHub configuration

Under **Settings → Secrets and variables → Actions**, add:

| Kind | Name | Value |
| --- | --- | --- |
| Secret | `GOOGLE_CLIENT_ID` | Your OAuth client ID |
| Secret | `GOOGLE_CLIENT_SECRET` | Matching OAuth client secret |
| Secret | `GOOGLE_REFRESH_TOKEN` | Offline token authorized for both scopes |
| Variable | `GA4_PROPERTY_ID` | Numeric property ID, not the `G-…` measurement ID |
| Variable | `GBP_LOCATION_IDS` | Comma-separated numeric IDs or `locations/ID` names |
| Variable, optional | `REPORT_TIMEZONE` | IANA zone, default `America/New_York` |

The supplied measurement ID is `G-S0Q3E4DEBJ`; it identifies the website data
stream and cannot be used as `GA4_PROPERTY_ID`. Get the numeric GA4 property ID
from Analytics Admin → Property details. Business Profile
location IDs are API resource IDs, not Google Maps Place IDs. Obtain them using
the [Business Information locations.list API](https://developers.google.com/my-business/reference/businessinformation/rest/v1/accounts.locations/list)
with `readMask=name,title` (enable that API if using it for discovery).

Allow GitHub Actions write access to repository contents. Organization policies
and branch rules must permit the bot to create/update `analytics-data`. No personal
access token is needed. Data on this branch has the repository's visibility;
use a private repository if these aggregate business reports should be private.

Run **Actions → Daily Google analytics and business data → Run workflow** once
and verify `analytics-data/data/google/latest.json` before relying on the schedule.

## Data and behavior

- GA4: daily active/new users, sessions, engaged sessions, page/screen views,
  events, key events, and revenue using
  [runReport](https://developers.google.com/analytics/devguides/reporting/data/v1/basics).
- Business Profile: daily desktop/mobile Search/Maps impressions, direction
  requests, call clicks, and website clicks for each location using
  [fetchMultiDailyMetricsTimeSeries](https://developers.google.com/my-business/reference/performance/rest/v1/locations/fetchMultiDailyMetricsTimeSeries).
  This is a performance export; it does not collect reviews or profile details.
- Each run refreshes a 14-day inclusive window ending yesterday. The timezone
  chooses yesterday; GA4 still reports in its property's timezone, and Business
  Profile uses its own reporting date semantics. Align the configured timezone
  with your property where possible. Recent data can be incomplete or revised.
- `YYYY-MM-DD.json` is a full window snapshot named by its end date; `latest.json`
  is the most recently executed snapshot, including manual backfills. Windows
  overlap: do not sum multiple snapshots. Use the newest snapshot covering a date.
  Missing rows/values remain as returned by Google; they are not invented zeros.
- Manual runs accept `end_date` and `days` (1–90) for backfills. Reports preserve
  Google's raw JSON structure, metric headers, and response metadata. A date-only
  GA4 dimension caps results at 90 rows, so pagination is unnecessary.
- The collector retries transient network failures, rate limits, and selected
  server errors. Permanent authorization/configuration errors fail immediately.
  Both sources must succeed before any output is published. Concurrent runs are
  serialized; commits only touch `data/google` on the dedicated branch, without
  force pushes. Successful collection also uploads a 30-day Actions artifact.
- Credentials never enter the output files. There are no third-party Python
  dependencies. Revoked/expired refresh tokens require reauthorization and a
  secret update. Check failed runs in Actions; HTTP 403 usually means missing
  permission, disabled APIs, unapproved Business Profile access, or quota.

## Local verification

```bash
python3 -m unittest discover -s scripts/google-data/tests -v
# With the five required values supplied securely in your environment:
python3 scripts/google-data/collect.py --output /tmp/google-data --days 14
```

Tests mock Google responses and cover date boundaries, ID validation, API query
construction, retries, sanitized failures, and prevention of partial exports.
They do not establish that live Google credentials or repository permissions work.
