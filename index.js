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

//이미지 관리
app.use("/upload", express.static("upload"));
const multer = require("multer");
const upload = multer({
    storage: multer.diskStorage({
        destination: "./upload/",
        filename: function(req, file, cb){
            //원본파일명에서 마지막 "."의 위치를 확인
            let num = file.originalname.lastIndexOf(".");
            //확장자 추출하기
            let re = file.originalname.substring(num);
            let imgname = String(Date.now())+re;
            //현재시간.확장자로 파일 업로드 하기 
            cb(null, `${imgname}`);
        }
    })
});
//이미지관리 end


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
app.get('/searchnor/:title', async (req, res)=> {
    const params = req.params.title;
    connection.query(
        `select * from norMemo 
        where title like '%${params}%'
        `,
        (err, rows, fields)=>{
            res.send(rows);
        }
    )
})

app.get('/mainindex/:userId', async (req, res)=> {
    const params = req.params.userId;
    const sql1 =  `select * from Users where userid = '${params}';`;
    const sql2 =  `select * from norMemo where userid = '${params}' order by nowDate desc;`;
    const sql3 =  `select * from emerMemo where userid = '${params}';`;
    const sql4 =  `select * from picMemo where userid = '${params}' order by nowDate desc;`;
    const sql5 =  `select * from Dday where userid = '${params}' limit 4 ;`;
    const sql6 =  `select * from bookmark where userid = '${params}' limit 18 ;`;
    const sql7 =  `select * from bookmark where userid = '${params}' limit 17, 20 ;`;
    const sql8 =  `select * from bookmark where userid = '${params}';`;
    const sql2_1 =  `select * from norMemo where userid = '${params}' order by nowDate desc limit 7;`;
    const sql4_1 =  `select * from picMemo where userid = '${params}' order by nowDate desc limit 4;`;
    connection.query(sql1 + sql2 + sql3 + sql4 + sql5 + sql6 + sql7 + sql8 + sql2_1 + sql4_1, function(err, rows, fields){
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

//간단메모

app.post("/emerAdd", async (req, res) => {
    const { emertext, userid } = req.body;
    connection.query(`insert into emerMemo(userid, memo) values ('${userid}', '${emertext}')`,
        (err, result, fields) => {
            res.send("등록 완료");
        }
    )
})

app.delete('/delemer/:id', async (req, res) => {
    const params = req.params;
    connection.query(`delete from emerMemo where id = ${params.id}`, (err, rows, fields) => {
        res.send(rows);
    })
})

//간단메모 종료

//디데이

app.post("/ddayAdd", async (req, res) => {
    const { datetext, ddaytext ,userid } = req.body;
    connection.query(`insert into Dday(userid, date, ddayDesc) values ('${userid}', '${datetext}', '${ddaytext}')`,
        (err, result, fields) => {
            res.send("등록 완료");
        }
    )
})

app.delete('/deldday/:id', async (req, res) => {
    const params = req.params;
    connection.query(`delete from Dday where id = ${params.id}`, (err, rows, fields) => {
        res.send(rows);
    })
})
//디데이 종료

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

app.post("/image", upload.single("img"), function(req, res, next) {
    res.send({
      img: req.file.filename
    });
    console.log(req.file.filename)
});

// 북마크
app.delete('/bmdelete/:id', async (req, res) => {
    const params = req.params;
    connection.query(`delete from bookmark where id = ${params.id}`, (err, rows, fields) => {
        res.send(rows);
    })
})
app.post("/bmadd", async (req, res) => {
    const { name, url, userid } = req.body;
    connection.query(`insert into bookmark(userid, name, url) values ('${userid}', '${name}', '${url}')`,
        (err, result, fields) => {
            res.send("등록 완료");
        }
    )
})

// 일반메모

app.post("/normemadd", async (req, res) => {
    const { title, norDesc, nowDate, userid } = req.body;
    connection.query(`insert into norMemo(userid, title, norDesc, nowDate) values ('${userid}', '${title}', '${norDesc}', '${nowDate}')`,
        (err, result, fields) => {
            res.send("등록 완료");
        }
    )
})
app.get('/normemodetail/:id', async (req, res)=> {
    const params = req.params.id;
    connection.query(
        `select * from norMemo where id=${params}`,
        (err, rows, fields)=>{
            if(!rows){
                console.log(err);
            }
            res.send(rows);
        }
    )
})
app.get('/normemoedit/:id', async (req, res)=> {
    const params = req.params.id;
    connection.query(
        `select * from norMemo where id=${params}`,
        (err, rows, fields)=>{
            if(!rows){
                console.log(err);
            }
            res.send(rows);
        }
    )
})
app.delete('/norDel/:id', async (req, res) => {
    const params = req.params;
    connection.query(`delete from norMemo where id = ${params.id}`, (err, rows, fields) => {
        res.send(rows);
    })
})
app.delete('/norAllDel/:userid', async (req, res) => {
    const params = req.params;
    connection.query(`delete from Users where userid = '${params.userid}'`, (err, rows, fields) => {
        res.send(rows);
    })
})
app.delete('/AllNorDel/:userid', async (req, res) => {
    const params = req.params;
    connection.query(`delete from norMemo where userid = '${params.userid}'`, (err, rows, fields) => {
        res.send(rows);
    })
})
app.put('/normemoedit/:id', async (req, res)=> {
    const { title, norDesc } = req.body;
    const params = req.params.id;
    connection.query(
        `update norMemo set title = '${title}', norDesc = '${norDesc}' where id = ${params}`,
        (err, rows, fields)=>{
            if(!rows){
                console.log(err);
            }
            res.send(rows);
        }
    )
})
//일반 종료

//사진메모

app.post("/picmemadd", async (req, res) => {
    const { pictitle, picDesc, nowDate, userid, picImg } = req.body;
    connection.query(`insert into picMemo(userid, pictitle, picDesc, picImg, nowDate) values ('${userid}', '${pictitle}', '${picDesc}', '${picImg}', '${nowDate}')`,
        (err, result, fields) => {
            res.send("등록 완료");
        }
    )
})

app.get('/picmemodetail/:id', async (req, res)=> {
    const params = req.params.id;
    connection.query(
        `select * from picMemo where id=${params}`,
        (err, rows, fields)=>{
            if(!rows){
                console.log(err);
            }
            res.send(rows);
        }
    )
})
app.delete('/AllPicDel/:userid', async (req, res) => {
    const params = req.params;
    connection.query(`delete from picMemo where userid = '${params.userid}'`, (err, rows, fields) => {
        res.send(rows);
    })
})
app.delete('/picDel/:id', async (req, res) => {
    const params = req.params;
    connection.query(`delete from picMemo where id = ${params.id}`, (err, rows, fields) => {
        res.send(rows);
    })
})

app.put('/picmemoedit/:id', async (req, res)=> {
    const { pictitle, picDesc, picImg } = req.body;
    const params = req.params.id;
    connection.query(
        `update picMemo set pictitle = '${pictitle}', picDesc = '${picDesc}' picImg = '${picImg}' where id = ${params}`,
        (err, rows, fields)=>{
            if(!rows){
                console.log(err);
            }
            res.send(rows);
        }
    )
})

//사진메모 종료

//요청 종료

app.listen(port, ()=>{
    console.log("My Page 서버가 돌아가고 있습니다.");
})