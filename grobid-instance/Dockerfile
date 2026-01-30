FROM lfoppiano/grobid:0.8.2

USER root

RUN apt-get update \
  && apt-get install -y --no-install-recommends python3 python3-pip curl \
  && rm -rf /var/lib/apt/lists/*

# ✅ DON'T set WORKDIR to /app (keeps grobid default behavior)

COPY requirements.txt /app/requirements.txt
RUN pip3 install --no-cache-dir -r /app/requirements.txt

COPY app.py /app/app.py
COPY start.sh /app/start.sh
RUN chmod +x /app/start.sh

ENV PORT=7860
ENV GROBID_URL=http://127.0.0.1:8070

EXPOSE 7860

CMD ["/app/start.sh"]
