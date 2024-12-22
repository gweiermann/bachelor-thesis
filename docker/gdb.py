#!/usr/bin/gbd --python

gdb.execute('file a.out')
gdb.execute('start')
gdb.execute('cont')

print("hello from python!!")
gdb.execute('quit')