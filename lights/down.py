#!/usr/bin/python

import sys
import os
import re


def download(path):
    if os.path.isfile(path):
        return
    site="http://lights.helloenjoy.com/";
    url = site + path

    file_name = os.path.basename(path)
    dir_name = os.path.dirname(path)
    print url
    print file_name
    print dir_name

    cmd = []
    cmd.append("wget " + url)
    cmd.append("mkdir -p " + dir_name)
    cmd.append("mv " + file_name + " " + path)

    for c in cmd:
        os.system(c)


def start():
    with open("js/Config.js") as f:
        for line in f:
            m = re.search(r'images/.+\.png', line)
            if m:
                print m.group(0)
                download(m.group(0))

#start()

if len(sys.argv) > 1:
    download(sys.argv[1])
