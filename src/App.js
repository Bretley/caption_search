import './App.css'
import React, {Component} from 'react'
import Search from './reverse_index.json'
import ReverseIndex from './ReverseIndex.js'

/*
const sum = (args) => args.reduce((a,b) => a+b)
const mean = (args) => sum(args) / args.length
const score = (args) => {
    let m = mean(args)
    let sse = -args
        .map(x => Math.pow(x-m, 2)) 
        .reduce((a,c) => a+c)
    return sse + sum(args)
}
*/

class App extends React.Component { 
  constructor(props) { 
    super(props)
    this.reverseIndex = new ReverseIndex(Search)
    this.state = {
      currentTerms: '',
    }
  }

  onChange = (e) => this
    .setState({currentTerms: e.target.value})

  render = () => { 
    const { currentTerms } = this.state
    const { onChange, reverseIndex } = this
    let results = this.reverseIndex.search(currentTerms || '', 7)
    return (
      <div className="App">
        <header className="App-header">
          <div style={{backgroundColor:'none', opacity:'100%'}}>
            <h1>Beau Index Search</h1>
            <h1>?</h1>
            <input style={{width: '600px', fontSize:'16pt', textAlign:'center'}} type='text' onChange={onChange}></input>
            {results.length !== 0 && <table className='results'>
              <tbody>
                {results.map(x => 
                  <tr key={x.title}>
                    <td onClick={() => window.open(`https://www.youtube.com/watch?v=${x.url}_blank`)}>
                      {`${x.title} (${x.score})`}
                    </td>
                  </tr>)}
              </tbody>
            </table>
            }
          </div>
        </header>
      </div>
    )
  }
            
}
export default App;
