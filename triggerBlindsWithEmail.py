import time
from itertools import chain
import email
import imaplib
import base64
import os
import re
import datetime


f = open("output.txt", "w")
f.close
clear_output = 1

def output (text):
    print(text)
    f = open("output.txt", "a")
    f.write(str(text))
    f.write('\n')
    f.close

# import RPi.GPIO as GPIO

def open_blinds():
    # pos = 2

    # GPIO.setmode(GPIO.BOARD)
    # GPIO.setup(11,GPIO.OUT)
    # p = GPIO.PWM(11,50)
    # p.start(0)

    output ("opening blinds")
    # p.ChangeDutyCycle(pos)
    # time.sleep(2)
    # p.ChangeDutyCycle(0)

    # p.stop()
    # GPIO.cleanup()

def close_blinds():
    # pos = 12

    # GPIO.setmode(GPIO.BOARD)
    # GPIO.setup(11,GPIO.OUT)
    # p = GPIO.PWM(11,50)
    # p.start(0)

    output ("closing blinds")
    # p.ChangeDutyCycle(pos)
    # time.sleep(2)
    # p.ChangeDutyCycle(0)

    # p.stop()
    # GPIO.cleanup()

#test servo on startup
open_blinds()
close_blinds()

imap_ssl_host = 'imap-mail.outlook.com'
imap_ssl_port = 993
username = 'akhilesh.blinds@outlook.com'
password = 'akhileshblinds123'

# if need to restrict mail search.
criteria = {}
uid_max = 0

def search_string(uid_max, criteria):
    c = list(map(lambda t: (t[0], '"'+str(t[1])+'"'), criteria.items())) + [('UID', '%d:*' % (uid_max+1))]
    return '(%s)' % ' '.join(chain(*c))
# Produce search string in IMAP format:
# e.g. (FROM "me@gmail.com" SUBJECT "abcde" BODY "123456789" UID 9999:*)
#Get any attachemt related to the new mail

#Getting the uid_max, only new email are process



try :
    #login to the imap
    mail = imaplib.IMAP4_SSL(imap_ssl_host)
    mail.login(username, password)
    #select the folder
    mail.select('inbox')

    result, data = mail.uid('SEARCH', None, search_string(uid_max, criteria))
    uids = [int(s) for s in data[0].split()]
    if uids:
        uid_max = max(uids)
        # Initialize `uid_max`. Any UID less than or equal to `uid_max` will be ignored subsequently.
    output(uid_max)

    result, data = mail.uid('fetch', str(uid_max), '(RFC822)')
    for response_part in data:
        if isinstance(response_part, tuple):
            #message_from_string can also be use here
            msg = email.message_from_bytes(response_part[1])
            subject = msg['subject']
            output('last email:' + subject)
            if subject == 'open blinds' :
                open_blinds()
            elif subject == 'close blinds' :
                close_blinds()
    mail.logout() #Logout before running the while loop
except Exception as err:
    output(f"Unexpected {err=}")

while 1:
    now = datetime.datetime.now()
    output(now.time())
    try:
        mail = imaplib.IMAP4_SSL(imap_ssl_host)
        mail.login(username, password)
        mail.select('inbox')
        result, data = mail.uid('search', None, search_string(uid_max, criteria))
        uids = [int(s) for s in data[0].split()]
        new_uid_max =  max(uids)

        if new_uid_max > uid_max:
            uid_max = new_uid_max

            result, data = mail.uid('fetch', str(uid_max), '(RFC822)')
            for response_part in data:
                if isinstance(response_part, tuple):
                    #message_from_string can also be use here
                    msg = email.message_from_bytes(response_part[1])
                    subject = msg['subject']
                    output('new email: ' + subject)
                    if subject == 'open blinds' :
                        open_blinds()
                    elif subject == 'close blinds' :
                        close_blinds()
        else:
            result, data = mail.uid('fetch', str(uid_max), '(RFC822)')
            for response_part in data:
                if isinstance(response_part, tuple):
                    msg = email.message_from_bytes(response_part[1])
                    subject = msg['subject']
                    output('no new emails, last email: ' + subject)
            
        mail.logout()
        clear_output = clear_output + 1
        if clear_output > 200:
            clear_output = 0
            f = open("output.txt", "w")
            f.close

        time.sleep(5)
    except Exception as err:
        output(f"Unexpected {err=}")

