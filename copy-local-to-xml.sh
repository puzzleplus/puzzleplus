#!/bin/bash

# Copies everything between <body>..</body> from localtest/test.html to wave/lmnowave.xml.

perl -ne 'print if /<body>/../<\/body>/' localtest/test.html > /tmp/body
perl -ne 'print if 1../<body>/' wave/lmnowave.xml > /tmp/prologue
perl -ne 'print if /<\/body>/..1' wave/lmnowave.xml > /tmp/postlogue

cat /tmp/prologue <(sed 1d /tmp/body) <(sed 1d /tmp/postlogue) > wave/lmnowave.xml

rm /tmp/prologue /tmp/body /tmp/postlogue
