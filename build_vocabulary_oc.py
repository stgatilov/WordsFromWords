import lxml.etree as ET
import sys

alphabet = 'абвгдеёжзийклмнопрстухфцчшщъыьэюя'
replacements = {'ё': 'е'}
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


def normalize(word):
    res = []
    for i in range(len(word)):
        ch = word[i]
        if ch not in alphabet:
            return None
        if ch in replacements:
            res.append(replacements[ch])
        else:
            res.append(ch)
    return ''.join(res)
    

frequences = {}
for l in open('unigrams.cyr.lc', 'rt', encoding = 'utf-8').readlines():
    tokens = l.split()
    assert len(tokens) == 3

    word = normalize(tokens[0])
    if not word:
        continue

    assert word not in frequences
    frequences[word] = int(tokens[1])


dictionary = {}
xmlfile = open('dict.opcorpora.xml', 'rb')
for event, lemma in ET.iterparse(xmlfile, tag = 'lemma'):
    assert lemma.tag == 'lemma'

    lem = lemma.find('l')
    normal_text = normalize(lem.attrib['t'])
    if normal_text is None or len(normal_text) < 2:
        lemma.clear()
        continue

    grammemes = []
    for gram in lem.iterfind('g'):
        grammemes.append(gram.attrib['v'])

    if 'NOUN' not in grammemes:
        lemma.clear()
        continue

    skip = False
    for bl in blacklisted_gramems:
        if bl in grammemes:
            skip = True
            break
    if skip:
        lemma.clear()
        continue

    all_freq = 0
    for form in lemma.iterfind('f'):
        text = normalize(form.attrib['t'])
        if not text:
            continue

        #assert text in frequences
        if text in frequences:
            all_freq += frequences[text]

    dictionary[normal_text] = all_freq
    lemma.clear()


dictlist = list(dictionary.items())
dictlist.sort(key = lambda x: (x[1],x[0]))
dictlist.reverse()
total = sum([x[1] for x in dictlist])
with open('words.txt', 'w', encoding = 'utf-8') as f:
    for x in dictlist:
        print('%s %d %0.6f' % (x[0], x[1], float(x[1]) / total), file = f)
