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
    multipleStatements: true
});
app.use(express.json());
app.use(cors());

//요청 시작

app.get('/mainindex', async (req, res)=> {
    connection.query(
        `select * from norMemo 
        inner join Users
        on norMemo.userid = Users.userid
        inner join picMemo
        on Users.userid = picMemo.userid
        order by nowDate DESC
        `,
        (err, rows, fields)=>{
            res.send(rows);
        }
    )
})

app.get('/mainindex/:userId', async (req, res)=> {
    const params = req.params.userId;
    const sql1 =  `select * from Users where userid = '${params}';`;
    const sql2 =  `select * from norMemo
                   inner join Users on norMemo.userid = Users.userid 
                   where Users.userid = '${params}' order by nowDate desc limit 6;`;
    const sql3 =  `select * from emerMemo where userid = '${params}';`;
    const sql4 =  `select * from picMemo
                    inner join Users on picMemo.userid = Users.userid
                    where Users.userid = '${params}' order by nowDate desc limit 4;`;
    const sql5 =  `select * from Dday where userid = '${params}' limit 4 ;`;
    connection.query(sql1 + sql2 + sql3 + sql4 + sql5, function(err, rows, fields){
        res.send(rows);
    }
    )
})


//요청 종료

app.listen(port, ()=>{
    console.log("My Page 서버가 돌아가고 있습니다.");
})