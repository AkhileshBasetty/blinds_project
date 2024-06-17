import time

f = open("output_test.txt", "w")
f.write("hello wrold \n")
while 1:
    f.write("2 hello wrold")
    time.sleep(1)
f.close()