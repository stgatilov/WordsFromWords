import pymorphy2
import lxml.etree as ET
import sys

morph = pymorphy2.MorphAnalyzer()
#x = morph.parse('бугогашеньки')
#print(x)
#x = morph.parse('столовую')
#print(x)
#x = morph.parse('иона')
#print(x)

alphabet = 'абвгдеёжзийклмнопрстухфцчшщъыьэюя'
blacklisted_gramems = [
    # see http://opencorpora.org/dict.php?act=gram
    'Name',
    'Abbr',
    'Surn',
    'Patr',
    'Geox',
    'Orgn',
    'Trad',
    'Subx',
    'Supr',
    'Qual',
    'Apro',
    'Anum',
    'Infr',
    'Slng',
    'Arch',
    'Erro',
    'Dist',
    'Init',
    'Hypo',
]

def get_words_from_xml_file(filename):

    cache = {}
    def process_word(w):
        if w in cache:
            return cache[w]

        info_all = morph.parse(w)
        if len(info_all) == 0:
            cache[w] = None
            return None

        info = info_all[0]
        if info.score < 0.8:
            cache[w] = None
            return None

        if info.tag.POS != 'NOUN':
            cache[w] = None
            return None

        skip = False
        for bl in blacklisted_gramems:
            if bl in info.tag:
                skip = True
                break
        if skip:
            cache[w] = None
            return None

        cache[w] = info.normal_form
        return info.normal_form

            
    dictionary = {}

    xmlfile = open(filename, 'rb')

    started = False
    for event, elem in ET.iterparse(xmlfile, events = ('start', 'end')):
        pos = elem.tag.find('}')
        tag = elem.tag[pos+1:]

        if tag == 'body':
            started = True

        if started and event == 'start' and elem.text:
            text = elem.text.lower()
            arr = list(text)
            for i in range(len(arr)):
                if alphabet.find(arr[i]) == -1:
                    arr[i] = ' '
            text = ''.join(arr)
            words = text.split()

            for w in words:
                nword = process_word(w)
                if nword:
                    if nword not in dictionary:
                        dictionary[nword] = 0
                    dictionary[nword] += 1

    return dictionary

filename = 'input.txt'
if len(sys.argv) >= 2:
    filename = sys.argv[1]

dictionary = get_words_from_xml_file('input.txt')

dictlist = list(dictionary.items())
dictlist.sort(key = lambda x: (x[1],x[0]))
dictlist.reverse()
total = sum([x[1] for x in dictlist])
with open('words.txt', 'w', encoding = 'utf-8') as f:
    for x in dictlist:
        print('%s %d %0.6f' % (x[0], x[1], float(x[1]) / total), file = f)
