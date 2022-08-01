const express = require("express");
const cors = require("cors");
const app = express();
const port = 3001;
const mysql = require("mysql");
const fs = require("fs");

const dbinfo = fs.readFileSync('./database.json');

const conf = JSON.parse(dbinfo);

const connection = mysql.createConnection({
    host:conf.host,
    user:conf.user,
    password:conf.password,
    port:conf.port,
    database:conf.database,
});
app.use(express.json());
app.use(cors());

//요청 시작

app.get('/mainindex', async (req, res)=> {
    connection.query(
        `select * from norMemo 
        inner join Users
        on norMemo.userid = Users.userid
        order by nowDate DESC
        `,
        (err, rows, fields)=>{
            res.send(rows);
        }
    )
})

app.get('/mainindex/:userId', async (req, res)=> {
    const params = req.params.userId;
    connection.query(
        `select * from Users 
        inner join emerMemo
        on Users.userid = emerMemo.userid
        where Users.userid = '${params}'`,
        (err, rows, fields)=>{
            if(!rows){
                console.log(err);
            }
            console.log(rows);
            res.send(rows);
        }
    )
})


//요청 종료

app.listen(port, ()=>{
    console.log("My Page 서버가 돌아가고 있습니다.");
})