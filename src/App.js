import logo from './logo.svg'
import './App.css'
import React, {Component} from 'react'
import Search from './reverse_index.json'
const natural = require('natural') 


console.log(Object.keys(Search))

let top100 = Search.globalCount
console.log('search', Search.search)
console.log('autocomplete', Search.autoComplete)
console.log('top results', top100)

class App extends React.Component { 
  constructor(props) { 
    super(props)
    this.state = {
      currentTerms: '',
      search: Search.search,
    }
  }

  onChange = (e) => {
    this.setState({currentTerms: e.target.value})
  }

  search = (terms) => {
    const {search} = this.state
    let results = [...new Set(terms.replace(/'/g, '').split(' '))]
      .map(x => search[natural.PorterStemmer.stem(x)])
      .filter(x => x !== undefined)
    // TODO: aggregate the results
    console.log(results)
    if (results !== undefined && results !== null) {
    }
    if (results.length !== 0) {
      let aggregates = {}
      results.forEach(x => {
        x.forEach(({title, count, url}) => {
          if (aggregates[title]) {
            aggregates[title].count += count
            aggregates[title].hits += 1
          } else {
            aggregates[title] = {title, count, hits:1, url}
          }
        })
      })
      results = Object.values(aggregates).sort((a, b) => 
        a.hits < b.hits ? 1
        : a.hits > b.hits ? -1
        : a.count < b.count ? 1
        : a.count > b.count ? -1
        : 0
      )
    }
    return results
  }

  complete = (terms) => {
    if (terms === undefined) {
      return ''
    }
    terms = terms.split(' ').slice(-1).split('')
    console.log('terms', terms)
    let cur = Search.autoComplete
    let pref = ''
    terms.forEach(x => {cur = cur.children[x]; pref += x})
    if (cur === undefined) {
      return []
    }
    while (cur !== undefined && !cur.ends) {
      let next = Object.entries(cur.children)
        .sort(([k,v],[k2, v2]) => 
          v.weight > v2.weight ? -1
          : v.weight < v2.weight ? 1
          :0)[0]
      cur = cur.children[next[0]]
      pref = pref.concat(next[0])
    }
    return pref
  }
  
  render = () => { 
    const {currentTerms, search} = this.state
    const {onChange} = this
    let results = currentTerms
    let complete = ''
    if (results === '') {
      results = [] 
    } else {
      results = this.search(currentTerms)
    } //let complete =this.complete(currentTerms) let complete = '' console.log()
    return (
      <div className="App">
        <header className="App-header">
          <div style={{backgroundColor:'none', opacity:'100%'}}>
            <h1>Beau Index Search</h1>
            <h1>?</h1>
            <input style={{width: '600px', fontSize:'16pt', textAlign:'center'}} type='text' onChange={onChange}></input>
            <div>{complete}</div>
            {results.length !== 0 && <table className='results'>
              <tbody>
                {results.slice(0,7).map(x => 
                  <tr key={x.title}>
                    <td onClick={() => window.open('https://www.youtube.com/watch?v=' + x.url, '_blank')}>
                      {`${x.title} (${x.count})`}
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
