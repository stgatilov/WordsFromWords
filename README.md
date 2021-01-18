# WordsFromWords

Немного кода по мотивам мобильной игры ["Слова из Слова"](https://play.google.com/store/apps/details?id=com.justanothertry.slovaizslova).

Примеры для отгадывания собираются полностью автоматически.
Поскольку абсолютно никакой ручной подкрутки примеров нет, качество деления слов на "популярные" и "редкие" оставляет желать лучшего.
Но играть вполне можно =)

## Поиграть

Играбельная версия здесь: https://stgatilov.github.io/WordsFromWords/playable/index.html

Чтобы набрать слово, надо кликать на большие буквы-кнопки.
Когда слово набрано, надо нажать "Проверить", и если такое слово есть, то она откроется.
На компьютере также можно набирать слова с клавиатуры.
В качестве "подсказки" можно нажать на пустую кнопку, чтобы узнать, какая там буква.

## Как собрать

Используется морфологический словарь и размеченный корпус текстов с [OpenCorpora](http://opencorpora.org/).

Морфологический словарь можно скачать здесь: [dict.opcorpora.xml.bz2](http://opencorpora.org/files/export/dict/dict.opcorpora.xml.bz2)

Размеченный корпус текста можно скачать здесь: [annot.opcorpora.xml.bz2](http://opencorpora.org/files/export/annot/annot.opcorpora.xml.bz2).

Оба файла надо распаковать в корневую директорию.
Далее следует запустить скрипт на Python 3 (предварительно поставить lxml с помощью `pip install lxml`):

    python build_vocabulary_oc3.py
    
Этот скрипт читает распакованные XML-файлы (может занять какое-то время) и пишет в файл `words.txt` список слов и частоту встречаемости каждого.

Далее надо собрать C++ код `find_words.cpp`:

    g++ find_words.cpp -O2 -o find_words
    
И запустить его:

    find_words.exe
    ./find_words
    
Он прочитает список слов и создаст примеры для игры.
В файл `result.txt` напишутся все найденные примеры, он используется исключительно для просмотра глазами.
В файл `viewer/www/data.js` запишутся примеры в JSON-виде, пригодные для подключения в javascript-код.

Далее остаётся только собрать javascript-код для веб-страницы.
Для этого надо установить node.js и npm.
В директории `viewer` надо установить пакеты:

    npm install
    
После чего собрать `bundle.js`:

    npm run build
    
Теперь в `www` должна лежать полная собранная версия, включая `data.js` и `bundle.js`.
Что играть, достаточно открыть `index.html` в браузере.

## Послесловие

Главная проблема --- как отделить "популярные и простые" слова от "редких и сложных".
Я пытался сделать это на основе частоты использования слов.

Изначально пытался даже обрабатывать дамп википедии с помощью pymorphy2, но результаты получались ужасные из-за "омонимии".
Редкое и неизвестное слово часто попадало в список "популярных" из-за того, что у него есть одинаковая словоформа с каким-нибудь популярным словом.
В итоге остановился на том, чтобы брать только данные OpenCorpora, на которых нет неоднозначности.

Очевидно, чтобы добиться хорошего качества примеров, необходим ручной труд:
нужно брать сгенерированные примеры, просматривать все слова, и руками перебрасывать слова из популярных в редкие и наоборот.
Ну или в случае уже популярной игры можно собирать телеметрию, и на основе неё адаптировать разделение слов на хорошие и плохие.