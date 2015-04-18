#!/usr/bin/python

import sys
import os
import re

with open("js/Lights.js") as f:
    whole = f.read()
    tpath = "js/lights/"
    sep = ".+"
    t = "\/\*\*\n \* Created by JetBrains WebStorm\."
    sep = t + "([\s\S]+?)([\s\S]+?)" + t
    m = re.findall(sep, whole)
    i=0
    for x in m:
        p = tpath + str(i)
        print str(i) + " " + x[1]
        i+=1
        with open(p,'w') as pf:
            pf.write(x[1])
    print len(m)
