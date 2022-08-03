const express = require("express");
const cors = require("cors");
const app = express();
const port = 3001;
const mysql = require("mysql");
const fs = require("fs");

const dbinfo = fs.readFileSync('./database.json');

const bcrypt = require('bcrypt');
const saltRounds = 10;

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

app.post("/join", async (req, res) => {
    let myPlanitextpw = req.body.pw;
    let myPass = "";
    if (myPlanitextpw != '' && myPlanitextpw != undefined) {
        bcrypt.genSalt(saltRounds, function (err, salt) {
            bcrypt.hash(myPlanitextpw, salt, function (err, hash) {
                myPass = hash;
                const { userid, name, phone1, phone2, phone3, email1, email2, addr1, addr2, img } = req.body;
                connection.query("insert into Users(userid, name, pw, phone1, phone2, phone3, email1, email2, addr1, addr2, img) values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
                    [userid, name, myPass, phone1, phone2, phone3, email1, email2, addr1, addr2, img],
                    (err, result, fields) => {
                        console.log(result);
                        console.log(err);
                        res.send("등록되었습니다.");
                    }
                )
            });
        });
    }
})

app.post('/login', async (req, res)=>{
    // usermail 값에 일치하는 데이터가 있는지 select문
    // userpass 암호화 해서 쿼리 결과의 패스워드랑 일치하는지 체크
    const {userid, pw} = req.body;
    connection.query(`select * from Users where userid = '${userid}'`,
        (err, rows, fields)=> {
            if(rows != undefined){
                if(rows[0] == undefined){
                    res.send(null)
                }else{
                    bcrypt.compare(pw, rows[0].pw, function(err, result){
                        if(result == true){
                            res.send(rows[0])
                        }else{
                            res.send("실패")
                        }
                    });
                }
            }else{
                res.send("실패");
            }
        }
    )
})


//요청 종료

app.listen(port, ()=>{
    console.log("My Page 서버가 돌아가고 있습니다.");
})