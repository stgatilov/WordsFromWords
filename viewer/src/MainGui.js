import React from 'react';

class LetterGui extends React.Component {
  constructor() {
    super();
  }
  render() {
    var classname = "letter";
    if (this.props.shade !== undefined)
      classname += " shade" + this.props.shade;
    return (
      <button id={this.props.id} className={classname} disabled={this.props.disabled ? "disabled" : undefined} onMouseDown={this.props.onClick}>
        {this.props.letter}
      </button>
    );
  }
}

class WordGui extends React.Component {
  constructor() {
    super();
  }
  render() {
    var letters = this.props.text.split('');
    var openedIds = this.props.openedIds || [];
    var extOnClick = this.props.onClick;
    var greyedIds = this.props.greyedIds || [];
    var shade = 1;
    for (var i = 0; i < letters.length; i++)
      if (!openedIds[i])
        shade = 0;
    if (this.props.special)
      shade = 2;
    return (
      <table>
        <tbody>
          <tr>
            {letters.map((ch,i) => (
              <td key={i}>
                <LetterGui letter={!openedIds[i] ? '_' : ch} disabled={greyedIds[i]} shade={shade} onClick={() => {
                  extOnClick(i,ch);
                }}/>
              </td>
            ))}
          </tr>
        </tbody>
      </table>
    );
  }
}

class WordsTableGui extends React.Component {
  constructor() {
    super();
  }
  render() {
    var wordList = this.props.words;
    wordList.sort((a,b) => {
      if (a.length !== b.length)
        return a.length > b.length ? -1 : 1;
      if (a !== b)
        return a < b ? -1 : 1;
      return 0;
    });

    var COLN = 6;
    var ROWN = Math.ceil(wordList.length / COLN);

    var wordTable = [];
    for (var i = 0; i < ROWN; i++) {
      wordTable[i] = Array(COLN);
      for (var j = 0; j < COLN; j++) {
        wordTable[i][j] = "";
        var k = j * ROWN + i;
        if (k < wordList.length)
          wordTable[i][j] = wordList[k];
      }
    }

    var extOnClick = this.props.onClick;
    return (
      <table className="wordtable">
        <tbody>
          {wordTable.map((row,i) => (
            <tr key={i}>
              {row.map((cell,j) => (
                <td key={j}>
                  <WordGui text={cell} openedIds={this.props.opened[cell]} special={this.props.special===cell} onClick={(i,ch) => {
                    extOnClick(cell, i, ch);
                  }}/>
                  {'*'.repeat(this.props.stars[cell])}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    );
  }
}

class MainGui extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      mainWord : MainGui.chooseRandomWord(props),
      inputWord : "",
      inputUsed: [],
      opened : {},
      extraRareGuessed: {},
      lastVerdict : "",
      lastGuess: undefined,
    };
  }

  componentDidMount() {
    document.addEventListener("keydown", (event) => {
      if (event.which === 8) {
        this.eraseLastLetter();
        event.preventDefault();
      }
    });
    document.addEventListener("keypress", (event) => {
      if (event.which === 8) {
        event.preventDefault();
        this.eraseLastLetter();
      }
      else if (event.key === "Enter")
        this.checkWord();
      else {
        var mainWord = this.state.mainWord;
        for (var i = 0; i < mainWord.length; i++) {
          if (this.state.inputUsed[i])
            continue;
          if (mainWord[i] === event.key) {
            this.addLetter(i);
            return;
          }
        }
      }
    });
  }

  static chooseRandomWord(props) {
    var allWords = Object.keys(props.data);
    var idx = Math.floor(Math.random() * allWords.length);
    return allWords[idx];
  }

  updateState(dict) {
    this.setState(Object.assign({}, this.state, dict));
  }

  addLetter(idx) {
    if (this.state.inputUsed[idx])
      return;
    var newWord = this.state.inputWord + this.state.mainWord[idx];
    var newUsed = this.state.inputUsed.slice();
    newUsed[idx] = true;
    this.updateState({inputWord: newWord, inputUsed: newUsed});
  }

  eraseLastLetter() {
    if (this.state.inputWord.length === 0)
      return false;

    var mainWord = this.state.mainWord;
    var newWord = this.state.inputWord;
    var ch = newWord[newWord.length - 1];
    newWord = newWord.slice(0, newWord.length - 1);
    var newInputUsed = this.state.inputUsed.slice();
    for (var i = mainWord.length - 1; i >= 0; i--)
      if (mainWord[i] === ch && newInputUsed[i]) {
        newInputUsed[i] = false;
        break;
      }

    this.updateState({inputWord: newWord, inputUsed: newInputUsed});
    return true;
  }

  checkWord(stringSet) {
    var mainWord = this.state.mainWord;
    var problem = this.props.data[mainWord];
    if (stringSet === undefined)
      stringSet = [this.state.inputWord];

    var newOpened = Object.assign({}, this.state.opened);
    var newRare = Object.assign({}, this.state.extraRareGuessed);
    var lastVerdict = "такого слова нет...";
    var lastGuess = undefined;
    for (var str of stringSet) {
      for (var x of problem) {
        if (x[0] === str) {
          var openedCnt = 0;
          if (str in newOpened)
            for (var i = 0; i < str.length; i++)
              openedCnt += !!newOpened[str][i];
          lastVerdict = (openedCnt === str.length ? "уже отгадано." : "ВЕРНО!")
          lastGuess = str;
          newOpened[str] = [];
          for (var i = 0; i < str.length; i++)
            newOpened[str][i] = true;
          if (x[2] < this.props.MIN_GOOD_FREQUENCY)
            newRare[str] = true;
        }
      }
    }

    this.updateState({opened: newOpened, inputWord: "", lastVerdict: lastVerdict, lastGuess: lastGuess, inputUsed: [], extraRareGuessed: newRare});
  }

  openLetter(word, idx) {
    var newOpened = Object.assign({}, this.state.opened);
    if (!(word in newOpened))
      newOpened[word] = [];
    newOpened[word][idx] = true;
    this.updateState({opened: newOpened});
  }

  openAll() {
    var mainWord = this.state.mainWord;
    var problem = this.props.data[mainWord];
    this.checkWord(problem.map(x => x[0]));
  }

  render() {
    var mainWord = this.state.mainWord;
    var problem = this.props.data[mainWord];
    var mainOpened = Array(mainWord.length).fill(true);

    var stars = {};
    var problemMain = [], problemRare = [];
    for (var x of problem) {
      var prob = x[2], str = x[0];
      var num = Math.floor(-Math.log10(prob) * 2) - 3;
      if (num < 1) num = 1;
      if (num > 7) num = 7;
      stars[str] = num;
      if (prob >= this.props.MIN_GOOD_FREQUENCY)
        problemMain.push(x);
      if (str in this.state.extraRareGuessed)
        problemRare.push(x);
    }

    return (
      <div>
        <WordsTableGui words={problemMain.map(x => x[0])} stars={stars} opened={this.state.opened} special={this.state.lastGuess} onClick={(cell,i,ch) => {
          this.openLetter(cell, i);
        }}/>
        <WordGui text={mainWord} openedIds={mainOpened} greyedIds={this.state.inputUsed} onClick={(i,ch) => {
          this.addLetter(i);
        }}/>
        <div>&nbsp;{this.state.inputWord}</div>
        <button onClick={() => this.checkWord()}>
          Проверить
        </button>
        <button onClick={() => this.openAll()}>
          Открыть все
        </button>
        <div>&nbsp;{this.state.lastVerdict}</div>
        <WordsTableGui words={problemRare.map(x => x[0])} stars={stars} opened={this.state.opened} special={this.state.lastGuess}/>
      </div>
    );
  }
}
export default MainGui;
