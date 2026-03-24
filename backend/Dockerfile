FROM python:3.10-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

RUN pip install newrelic

COPY . .

EXPOSE 4000
CMD sh -c "newrelic-admin generate-config $NEW_RELIC_LICENSE_KEY newrelic.ini && newrelic-admin run-program python app.py"
