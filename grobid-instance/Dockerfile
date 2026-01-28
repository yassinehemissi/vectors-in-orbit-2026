FROM grobid/grobid:0.8.0

USER root

RUN apt-get update \
  && apt-get install -y --no-install-recommends python3 python3-pip \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY requirements.txt /app/requirements.txt
RUN pip3 install --no-cache-dir -r /app/requirements.txt

COPY app.py /app/app.py
COPY start.sh /app/start.sh
RUN chmod +x /app/start.sh

ENV PORT=7860
ENV GROBID_URL=http://127.0.0.1:8070

EXPOSE 7860

CMD ["/app/start.sh"]
