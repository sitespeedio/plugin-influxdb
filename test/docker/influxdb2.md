# Sitespeed.io + InfluxDB 2.x + Grafana Integration

This project provides a ready-to-use environment for visualizing **Sitespeed.io** performance results in **Grafana**, powered by **InfluxDB 2.x**.

---

## 🧩 Components

The provided `docker-compose.yml` file includes everything needed:

1. **InfluxDB 2** — stores performance metrics from Sitespeed.io
2. **Grafana** — comes with a ready-made, comprehensive dashboard
3. **MinIO** — stores Sitespeed.io HTML reports for displaying in Grafana

---

## ⚙️ Setup Instructions

### 1. Start all services

```bash
docker-compose -f test/docker/docker-compose.yml up -d
````

### 2. Open Grafana

Go to [http://localhost:3000](http://localhost:3000)

- **Username:** `sitespeed`
- **Password:** `sitespeed`

### 3. Access the dashboard

Open **[Sitespeed] Single Page** in Grafana.

### 4. Run Sitespeed.io and send metrics to InfluxDB

```bash
sitespeed.io https://www.sitespeed.io -n 1 \
--influxdb.host 127.0.0.1 \
--influxdb.port 8087 \
--influxdb.version 2 \
--influxdb.organisation sitespeed_org \
--influxdb.token sitespeed_token \
--influxdb.annotationScreenshot=true \
--plugins.add @sitespeed.io/plugin-influxdb \
--slug=mytest \
--config=test/docker/s3Config.json
```

### 5. Repeat tests and observe metrics in Grafana

You can run Sitespeed.io multiple times — all collected metrics will be visualized in Grafana.






