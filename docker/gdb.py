#!/usr/bin/gbd --python

class MyBreakpoint (gdb.Breakpoint):
    def stop (self):
        print(f'Breakpoint {self.number} at {self.location} {self.condition} {self.enabled}')
        return False

gdb.execute('file a.out')

# Breakpoint on every line
# MyBreakpoint('bubbleSort if 1==1')

gdb.execute('start')
for i in range(10):
    data = gdb.decode_line()[1]
    if (type(data) is tuple):
        print(data[0].symtab)
    # else:
    #     print(data)
    gdb.execute('next')

gdb.execute('quit')