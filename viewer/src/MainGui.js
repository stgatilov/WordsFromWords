import React from 'react';

class LetterGui extends React.Component {
  constructor() {
    super();
  }
  render() {
    return (
      <button id={this.props.id} onClick={this.props.onClick}>
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
    var closed = this.props.closed;
    var extOnClick = this.props.onClick;
    return (
      <table>
        <tbody>
          <tr>
            {letters.map((ch,i) => (
              <td key={i}>
                <LetterGui letter={closed ? '?' : ch} onClick={() => { extOnClick(i,ch); }}/>
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

    const COLSZ = 6;
    var k = 0;
    var wordTable = [];
    for (var i = 0; i < 100 && k < wordList.length; i++) {
      wordTable[i] = Array(COLSZ);
      for (var j = 0; j < COLSZ; j++, k++) {
        wordTable[i][j] = "";
        if (k < wordList.length)
          wordTable[i][j] = wordList[k];
        k++;
      }
    }

    return (
      <table>
        <tbody>
          {wordTable.map((row,i) => (
            <tr key={i}>
              {row.map((cell,j) => (
                <td key={j}>
                  <WordGui text={cell}/>
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
      opened : {},
    };
  }

  static chooseRandomWord(props) {
    var allWords = Object.keys(props.data);
    var idx = Math.floor(Math.random() * allWords.length);
    return allWords[idx];
  }

  updateState(dict) {
    this.setState(...dict, ...this.state);
  }

  render() {
    var mainWord = this.state.mainWord;
    var problem = this.props.data[mainWord];
    return (
      <div>
        <LetterGui id={73} letter={'ф'}/>
        <WordGui text={"фыва"} closed={true}/>

        <WordsTableGui words={problem.map(x => x[0])}/>
        <WordGui text={mainWord} onClick={(i,ch) => this.updateState({inputWord: this.state.inputWord + ch})}/>
        <div>{this.state.inputWord}</div>
      </div>
    );
  }
}
export default MainGui;
