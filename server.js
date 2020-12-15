const express = require("express");
const mongoose = require("mongoose");
require("dotenv").config();
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const path = require("path");

//Defining App
const app = express();

//Body persing Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json({ limit: "50mb" }));

//Using session and passport
app.use(
	session({
		secret: process.env.PASSPORT_SECRET,
		resave: false,
		saveUninitialized: false,
	})
);

app.use(passport.initialize());
app.use(passport.session());

//mongoose connection
mongoose
	.connect(process.env.MONGODB_URI, {
		useNewUrlParser: true,
		useUnifiedTopology: true,
		useFindAndModify: true,
	})
	.then((res) => {
		console.log("Database connected");
	})
	.catch((error) => {
		console.log(error);
	});

mongoose.set("useCreateIndex", true);

//...............................ALL Mongoose Schema Starts..................................//
//User Schema
const userSchema = new mongoose.Schema({
	email: {
		type: String,
	},
	password: {
		type: String,
	},
});

userSchema.plugin(passportLocalMongoose);
const User = new mongoose.model("User", userSchema);
passport.use(User.createStrategy());

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app
	.route("/api/user")

	.post((req, res) => {
		User.register(
			{ username: req.body.username },
			req.body.password,
			(error, user) => {
				if (error) {
					res.status(500).send(error);
				} else {
					passport.authenticate("local")(req, res, () => {
						res.send(user.username);
					});
				}
			}
		);
	})
	.get((req, res) => {
		User.find({ username: req.body.username }, function (error, user) {
			if (error) {
				res.status(404).send(error);
			} else {
				res.send(user);
			}
		});
	});

//Login Route
app.route("/api/user/login").post((req, res) => {
	const user = new User({
		username: req.body.username,
		password: req.body.password,
	});

	req.logIn(user, (error) => {
		if (error) {
			res.status(401).send(error);
		} else {
			passport.authenticate("local")(req, res, () => {
				User.find({ username: user.username }, function (error, user) {
					if (error) {
						res.send(error);
					} else {
						res.send(user);
					}
				});
			});
		}
	});
});

//Project Schema
const projectSchema = new mongoose.Schema({
	title: {
		type: String,
		required: true,
	},
	category: {
		type: String,
		required: true,
	},
	description: {
		type: String,
		required: true,
	},
	previewImages: {
		type: Array,
		required: true,
	},
	frameworks: {
		type: Array,
		required: true,
	},
	functionalities: {
		type: Array,
		required: true,
	},
	previewLink: {
		type: String,
		required: true,
	},
});

const Projects = new mongoose.model("Projects", projectSchema);

//projects route
app
	.route("/api/projects")
	.get((req, res) => {
		Projects.find({}, (error, projects) => {
			if (error) {
				res.status(500).send("Something went wron while getting projects");
			} else {
				res.send(projects);
			}
		});
	})
	.post((req, res) => {
		const projects = new Projects({
			title: req.body.title,
			category: req.body.category,
			description: req.body.description,
			previewImages: req.body.previewImages,
			frameworks: req.body.frameworks,
			functionalities: req.body.functionalities,
			previewLink: req.body.previewLink,
		});

		projects.save((error, success) => {
			if (error) {
				res.status(500).send(error);
			} else {
				res.send("Project Saved Successfully");
			}
		});
	})
	.delete((req, res) => {
		Projects.deleteMany({}, (error, success) => {
			if (error) {
				res.status(500).send(error);
			} else {
				res.send("Successfully Deleted All Projects");
			}
		});
	});

//individual project
app
	.route("/api/projects/:id")

	.get((req, res) => {
		Projects.find({ _id: req.params.id }, (error, project) => {
			if (error) {
				res.status(500).send("Something went wrong while getting the Project");
			} else {
				res.send(project);
			}
		});
	})

	.put((req, res) => {
		Projects.findByIdAndUpdate(
			{ _id: req.params.id },
			{
				title: req.body.title,
				category: req.body.category,
				description: req.body.description,
				previewImages: req.body.previewImages,
				frameworks: req.body.frameworks,
				functionalities: req.body.functionalities,
				previewLink: req.body.previewLink,
			},
			(error, success) => {
				if (error) {
					res
						.status(500)
						.send("something went wrong while updating the project");
				} else {
					res.send("Project Updated Successfully");
				}
			}
		);
	})
	.delete((req, res) => {
		Projects.findByIdAndDelete({ _id: req.params.id }, (error, success) => {
			if (error) {
				res.status(500).send("something went wrong while deleting the project");
			} else {
				res.send("Successfully Deleted The Project");
			}
		});
	});
//..................................Production Setup.......................................//

// Production
if (process.env.NODE_ENV === "production") {
	app.use(express.static("client/build"));
	app.get("*", (req, res) => {
		res.sendFile(path.join(__dirname, "client", "build", "index.html"));
	});
}

const port = process.env.PORT || 5000;
app.listen(port, () => {
	console.log(`App started at port ${port}`);
});