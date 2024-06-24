const express = require("express");
const { Sequelize, QueryTypes } = require("sequelize");
const config = require("./config/config.json");
const sequelize = new Sequelize(config.development);
const bcrypt = require("bcrypt");
const session = require("express-session");
const flash = require("express-flash");

const path = require("path");

const app = express();
const port = 5000;

// template engine yang dipakai
app.set("view engine", "hbs");
app.set("views", path.join(__dirname, "src/views"));

app.use("/assets", express.static(path.join(__dirname, "src/assets")));
// middelware : berfungsi sebagai alat memproses inputan dari form / request
app.use(express.urlencoded({ extended: false }));
app.use(flash());
app.use(
  session({
    name: "data",
    secret: "rahasia",
    resave: false,
    saveUninitialized: true,
    cookie: {
      secure: false,
      maxAge: 1000 * 60 * 60 * 24,
    },
  })
);

//routing
app.get("/index", home);
app.get("/blog", blog);
app.get("/addblog", viewBlog);
app.post("/addblog", addBlog);
app.get("/blog-detail/:id", blogDetail);
app.get("/update-blog/:id", editBlogView);
app.get("/product", product);
app.get("/contactme", contactme);
app.post("/update-blog", updateBlog);
app.post("/delete-blog/:id", deleteBlog);
app.get("/login", loginview);
app.post("/login", login);
app.get("/register", registerview);
app.post("/register", register);
app.get("/logout", logout);

function home(req, res) {
  const isLogin = req.session.isLogin;
  const user = req.session.user;

  res.render("index", { user, isLogin });
}

async function blog(req, res) {
  const query = `SELECT *
	FROM "Blogs";`;
  const obj = await sequelize.query(query, { type: QueryTypes.SELECT });
  res.render("blog", { data: obj });
}
function viewBlog(req, res) {
  res.render("addblog");
}
//array manipulation
async function addBlog(req, res) {
  const { title, content } = req.body;
  const date = new Date();
  const datestring = date.toISOString().slice(0, 19).replace("T", " ");
  const query = `insert into "Blogs"(title, content,"createdAt", "updatedAt") values ('${title}', '${content}', '${datestring}', '${datestring}')`;
  await sequelize.query(query, { type: QueryTypes.INSERT });
  res.redirect("/blog");
}
async function blogDetail(req, res) {
  const { id } = req.params;
  const query = `select * from "Blogs" where id = '${id}' `;
  const obj = await sequelize.query(query, { type: QueryTypes.SELECT });
  res.render("blog-detail", { detail: obj[0] });
}
async function editBlogView(req, res) {
  const { id } = req.params;
  const isLogin = req.session.isLogin;
  if (null == isLogin || !isLogin) {
    req.flash("danger", "login failed: email is wrong");
    return res.redirect("/login");
  }
  const query = `select * from "Blogs" where id = '${id}' `;
  const obj = await sequelize.query(query, { type: QueryTypes.SELECT });
  res.render("update-blog", { data: obj[0] });
}
async function updateBlog(req, res) {
  const { title, content, id } = req.body;
  const date = new Date();
  const datestring = date.toISOString().slice(0, 19).replace("T", " ");
  const query = `update "Blogs" set title= '${title}', content= '${content}', "createdAt"='${datestring}',"updatedAt"='${datestring}' WHERE id=${id}`;
  await sequelize.query(query, { type: QueryTypes.UPDATE });
  console.log(req);
  res.redirect("/blog");
}
async function deleteBlog(req, res) {
  const { id } = req.params;
  const query = `delete from "Blogs" where id = ${id} `;
  await sequelize.query(query, { type: QueryTypes.DELETE });
  res.redirect("/blog");
}
//blog
function product(req, res) {
  res.render("product");
}
function contactme(req, res) {
  res.render("contactme");
}
function loginview(req, res) {
  res.render("login-form");
}

async function login(req, res) {
  const { email, password } = req.body;
  const query = `select * from "Users" where email= '${email}' `;
  const obj = await sequelize.query(query, { type: QueryTypes.SELECT });
  if (!obj.length) {
    req.flash("danger", "login failed: email is wrong");
    return res.redirect("/login");
  }
  bcrypt.compare(password, obj[0].password, (err, result) => {
    if (err) {
      req.flash("danger", "Login Failed: Internal Server Error");
      return res.redirect("/login");
    }
    if (!result) {
      req.flash("danger", "Login Failed: Password Is Wrong");
      return res.redirect("/login");
    }
    req.flash("success", "Login Success");
    req.session.isLogin = true;
    req.session.user = {
      name: obj[0].name,
      email: obj[0].email,
    };
    res.redirect("/index");
  });
}
function registerview(req, res) {
  res.render("register-form");
}

async function register(req, res) {
  const { name, email, password } = req.body;
  const query = `select * from "Users" where email= '${email}'`;
  const obj = await sequelize.query(query, { type: QueryTypes.SELECT });
  const createdAt = new Date();
  const updatedAt = new Date();
  if (obj[0].length === 1) {
    req.flash("danger", "Register Failed: Email Is Already Used !");
    return res.redirect("/register");
  }
  bcrypt.hash(password, 10, async (err, hash) => {
    if (err) {
      req.flash("danger", "Register Failed: Password Failed to Encrypt");
      return res.redirect("/register");
    }
    const query = `insert into "Users" (name, email, password) values ('${name}', '${email}', '${hash}')`;
    await sequelize.query(query, { type: QueryTypes.INSERT });
    req.flash("success", "Register Success");
    res.redirect("/login");
  });
}
function logout(req, res) {
  req.session.destroy((err) => {
    if (err) {
      console.log(err);
    }
    res.redirect("/login");
  });
}

app.listen(port, () => {
  console.log(`server berjalan di port ${port}`);
});
