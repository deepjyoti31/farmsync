# IoT integration

FarmSync accepts readings from any device that can make an HTTPS POST request: weather stations, soil moisture probes, tank level sensors, livestock trackers, or a Raspberry Pi with a few sensors attached. Readings appear on the **Sensors** page as live charts.

## 1. Deploy the ingest function

```bash
npx supabase functions deploy ingest-telemetry --project-ref <project-ref>
```

The function URL is:

```text
https://<project-ref>.supabase.co/functions/v1/ingest-telemetry
```

## 2. Register a device

In FarmSync, open **Sensors > Add Device**, give it a name and type, and click **Register Device**. A device API key (`dev_` followed by 48 hex characters) is shown once. Store it on the device.

Treat the key like a password: anyone holding it can post readings for that device. To rotate a key, register a new device and retire the old one.

## 3. Send readings

Each request needs two headers:

| Header | Value | Why |
| --- | --- | --- |
| `Authorization` | `Bearer <anon-public-key>` | Supabase edge functions require a valid project JWT by default. The anon key is public and grants no data access by itself |
| `x-device-api-key` | The device key from step 2 | Identifies and authenticates the device |

The body is a JSON object of measurements. Use any field names you like; every numeric field is charted automatically.

```bash
curl -X POST "https://<project-ref>.supabase.co/functions/v1/ingest-telemetry" \
  -H "Authorization: Bearer <anon-public-key>" \
  -H "x-device-api-key: dev_0123..." \
  -H "Content-Type: application/json" \
  -d '{"temperature": 27.4, "humidity": 61, "soil_moisture": 33.5}'
```

A successful call returns:

```json
{ "success": true, "message": "Telemetry received" }
```

### Payload rules

- Numbers and numeric strings (`"21.5"`) are charted; other values are stored but not charted.
- The optional `type` field labels the reading, for example `"interval_reading"` (default) or `"alert"`.
- The server records the time it received the reading. Batch uploads of historical data are not supported yet.
- The Sensors page shows the four most frequently reported fields from the last 50 readings.

### Example: ESP32 / Arduino (C++)

```cpp
#include <WiFi.h>
#include <HTTPClient.h>

void sendReading(float temperature, float humidity) {
  HTTPClient http;
  http.begin("https://<project-ref>.supabase.co/functions/v1/ingest-telemetry");
  http.addHeader("Authorization", "Bearer <anon-public-key>");
  http.addHeader("x-device-api-key", "dev_0123...");
  http.addHeader("Content-Type", "application/json");

  String body = "{\"temperature\":" + String(temperature, 1) +
                ",\"humidity\":" + String(humidity, 1) + "}";
  int status = http.POST(body);
  http.end();
}
```

### Example: Python

```python
import requests

requests.post(
    "https://<project-ref>.supabase.co/functions/v1/ingest-telemetry",
    headers={
        "Authorization": "Bearer <anon-public-key>",
        "x-device-api-key": "dev_0123...",
    },
    json={"soil_moisture": 31.2, "battery_v": 3.9},
    timeout=10,
)
```

## Errors

| Status | Body | Meaning |
| --- | --- | --- |
| 401 | `Missing device API key` | The `x-device-api-key` header is absent |
| 401 | `Invalid API key or device not found` | The key does not match any device |
| 401 | (Supabase gateway error) | The `Authorization` header is missing or not a valid project key |
| 400 | `{ "error": "..." }` | The body is not valid JSON or the insert failed |

## Recommended reporting interval

Every 5 to 15 minutes is plenty for most field sensors and keeps you well within Supabase free-tier limits. Send immediately for alerts.
