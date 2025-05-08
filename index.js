//import required modules
import express from "express";
import path from "path";
import multer from "multer";
import dotenv from "dotenv";
import projFunc from './modules/projects/projDb.js'; 
import tagFunc from './modules/tags/tagDb.js'; 
import { ObjectId } from "mongodb";
import cors from 'cors';
import { fileURLToPath } from 'url'; 
import { dirname } from 'path'; 

const __filename = fileURLToPath(import.meta.url); 
const __dirname = dirname(__filename); 

//set up Express object and port
const app = express();
const port = process.env.PORT || "2024";
// load env variables
dotenv.config();

app.set("views", path.join(__dirname, "views"));
app.set("view engine", "pug");

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use(cors({
    origin: '*'
}));

// img upload
var storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, 'public/img')
    },
    filename: function (req, file, cb) {
      cb(null, file.originalname)
    }
})

app.use(express.static('public/img'));
var upload = multer({ storage: storage });

app.use(express.static(path.join(__dirname, "public")));

//https://medium.com/swlh/how-to-upload-image-using-multer-in-node-js-f3aeffb90657
app.post('/img', upload.single('screen'), function (req, res, next) {
    // req.file is the `screen` file
    // req.body will hold the text fields, if there were any
    console.log(JSON.stringify(req.file))
    var response = '<a href="/">Home</a><br>'
    response += "Files uploaded successfully.<br>"
    response += `<img src="/img/${req.file.path}" /><br>`
    return res.send(response);
  })



// project - api
app.get("/api/project/list", async (req, res) => {
    let projList = await projFunc.getProjects(); 
    res.json(projList); 
});

// tag - api
app.get("/api/tag/list", async (req, res) => {
    let tagList = await tagFunc.getTags(); 
    res.json(tagList); 
});

// admin page
app.get("/", async (request, response) => {
    let projList = await projFunc.getProjects();
    let tagList = await tagFunc.getTags();
    let projCount=projList.length;
    let tagCount=tagList.length;
    response.render("index", { title: "Welcome to Flora's Portfolio API and Admin System", projCounts:projCount,tagCounts:tagCount})
}
);

// project pages - list
app.get("/project", async (request, response) => {
    let projList = await projFunc.getProjects();
    if (!projList.length) {
        await projFunc.initializeProjects();
        projList = await projFunc.getProjects();
    }
    const formatprojList = projList.map(project => {
        project.CreatedDateFormatted = new Date(project.CreatedDate).toISOString().split('T')[0];
        return project;
    });
    response.render("project", { title: "Project Collection", myProj: formatprojList })
}
);

// project pages - add
app.get("/project/add", async (request, response) => {
    let projList = await projFunc.getProjects();
    let tagList = await tagFunc.getTags();
    response.render("project-add", { title: "Add a New Project", myProj: projList, myTag:tagList});
});

// project pages - add(submit)
app.post("/project/add/submit",upload.single('screen'), async (request, response) => {
    console.log(request.body);
    //get form data 
    let newproj = {
        ProjectName: request.body.projName, 
        Desc: request.body.desc,
        Details: request.body.details,
        Tags: Array.isArray(request.body.tag) ? request.body.tag : [request.body.tag],
        Img: request.file.filename,
        Link: request.body.link,
        Repo: request.body.repo,
        CreatedDate: new Date()
    };
    await projFunc.addProject(newproj);
    response.redirect("/project");
});

// project pages - delete
app.get("/project/delete", async (request, response) => {
    let id = request.query.projId;
    await projFunc.deleteProj(id);
    response.redirect("/project");
})

// project pages - edit
app.get("/project/edit", async (request, response) => {
    if (request.query.projId) {
        let projToEdit = await projFunc.getOneProj(request.query.projId);
        let projList = await projFunc.getProjects();
        let tagList = await tagFunc.getTags();
        console.log(projToEdit);
        console.log(tagList);
        response.render("project-edit", { title: "Edit the Project", myProj: projList, editProj: projToEdit,myTag:tagList });
    }
    else {
        response.redirect("/project");
    }
});

// project pages - edit(submit)
app.post("/project/edit/submit", upload.single('screen'),async (request, response) => {
    let id = request.body.projId;
    let idFilter = { _id: new ObjectId(id) };
    let updatedProj = {
        "ProjectName": request.body.projName,
        "Desc": request.body.desc,
        "Details": request.body.details,
        "Tag": Array.isArray(request.body.tag) ? request.body.tag : [request.body.tag],
        "Img": request.file ? request.file.filename : request.body.oldImg,
        "Link": request.body.link,
        "Repo": request.body.repo,
    }
    console.log(updatedProj);
    //run editLink(idFilter, link) and await the result
    let test=await projFunc.updateProj(idFilter, updatedProj);
    console.log(test);
    response.redirect("/project");
})


// tag pages - list
app.get("/tag", async (request, response) => {
    let tagList = await tagFunc.getTags();
    if (!tagList.length) {
        await tagFunc.initializeTags();
        tagList = await tagFunc.getTags();
    }
        const formattagList = tagList.map(tag => {
            tag.CreatedDateFormatted = new Date(tag.CreatedDate).toISOString().split('T')[0];
            return tag;
        });   
    response.render("tag", { title: "Tag Collection", myTag: formattagList })
});


// tag pages - add
app.get("/tag/add", async (request, response) => {
    let tagList = await tagFunc.getTags();
    response.render("tag-add", { title: "Add a New Tag", myTag: tagList })
});

// tag pages - add(submit)
app.post("/tag/add/submit", async (request, response) => {
    //get form data 
    let tagName = request.body.tag;
    let color = request.body.color;
    await tagFunc.addTag(tagName, color, new Date());
    response.redirect("/tag");
});

// tag pages - delete
app.get("/tag/delete", async (request, response) => {
    let id = request.query.tagId;
    await tagFunc.deleteTag(id);
    response.redirect("/tag");
})

// tag pages - edit
app.get("/tag/edit", async (request, response) => {
    if (request.query.tagId) {
        let tagToEdit = await tagFunc.getOneTag(request.query.tagId);
        let tagList = await tagFunc.getTags();
        response.render("tag-edit", { title: "Edit the tag", myTag: tagList, editTag: tagToEdit });
    }
    else {
        response.redirect("/tag");
    }
});

// tag pages - edit(submit)
app.post("/tag/edit/submit", async (request, response) => {
    //get the _id and set it as a JSON object to be used for the filter
    let id = request.body.tagId;
    let idFilter = { _id: new ObjectId(id) };
    let updatedTag={
        TagName:request.body.tag,
        Color:request.body.color,
    }
    await tagFunc.updateTag(idFilter, updatedTag);
    response.redirect("/tag");
})


// document pages - project
app.get("/project/doc", async (request, response) => {
    let projList = await projFunc.getProjects();
    let projOne = JSON.stringify(projList[0], null, 2);
    response.render("project-doc", { title: "Project Documentation", projEg: projOne });
});

// document pages - tag
app.get("/tag/doc", async (request, response) => {
    let tagList = await tagFunc.getTags();
    let tagOne=tagList[0]
    response.render("tag-doc", { title: "Tag Documentation", tagEg: tagOne });
});


//set up server listening
app.listen(port, () => {
    console.log(`Listening on http://localhost:${port}`);
});

