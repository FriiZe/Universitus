FROM ubuntu

RUN apt update
RUN apt install python3 -y

WORKDIR /game
ADD game /game

CMD PYTHONIOENCODING=utf-8 python3 main.py
