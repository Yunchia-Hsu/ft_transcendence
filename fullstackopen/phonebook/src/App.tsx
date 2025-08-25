

//typscript
//從 React 匯入兩個 Hook：
//useState：在函式型元件裡放「狀態」
//useEffect：處理「副作用」（例如發 HTTP 請求、訂閱事件…），在畫面渲染後執行
import { useState, useEffect } from "react";
import axios from "axios";//匯入 Axios：一個發 HTTP 請求的函式庫（回傳 Promise）。

type Person = { id: string; name: string; number: string };

export default function App() {//宣告主元件 App（預設匯出）。
  const [persons, setPersons] = useState<Person[]>([]);
  //宣告狀態 persons，初值為空陣列 []。
  //Person[] 是「Person 的陣列」。setPersons 是改它的 setter。
  useEffect(() => {
    axios
      .get<Person[]>("http://localhost:3001/persons")//useEffect 發請求
      .then(res => {setPersons(res.data)
        console.log('promise fulfilled')
      })//請求成功時 把回來的資料放進狀態 → 觸發重新渲染。
      .catch(err => console.error("fetch failed:", err));
  }, []);// 只在第一次渲染後執行

  //渲染 UI：把 persons 迭代成 <li> 列表。
  return (
    <div>
      <h1>Phonebookkkkkkk 4 people</h1>
      <ul>
        {persons.map(p => ( 
          <li key={p.id}>{p.name} — {p.number}</li> //key={p.id} 很重要：讓 React 能正確追蹤每列（避免重排錯亂）。
        ))}
      </ul>
    </div>
  );
}
