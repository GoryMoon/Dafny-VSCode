#!/bin/bash

version_url="https://raw.githubusercontent.com/FunctionalCorrectness/Dafny/master/version.txt"

dafny_osx_url="https://raw.githubusercontent.com/FunctionalCorrectness/Dafny/master/osx.txt"

dafny_url=$(curl $dafny_osx_url)
echo $dafny_url

cd ~
mkdir -p "Downloads/Dafny"
cd Downloads/Dafny
curl -L -o "DafnyOSX.zip" $dafny_url

unzip "DafnyOSX.zip"