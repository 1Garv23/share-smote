import multiprocessing

bind = "0.0.0.0:8080"
workers = min((2 * multiprocessing.cpu_count()) + 1, 8)
worker_class = "uvicorn.workers.UvicornWorker"
timeout = 120
graceful_timeout = 30
keepalive = 5
