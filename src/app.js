import express from "express"
import cookieParser from "cookie-parser"
import cors from "cors"

const app = express()
app.use(cors({
    origin : process.env.CORS_ORIGIN,
    credentials: true
}))

app.use(express.json({limit:"16kb"}))
app.use(express.urlencoded({extended:true,limit:"16kb"}))
app.use(express.static("public"))
app.use(cookieParser())

import userRouter from "./routes/user.routes.js";
import startupRouter from "./routes/startup.routes.js"; 
import adminRouter from "./routes/admin.routes.js";
import investmentRouter from "./routes/investment.routes.js";
import bookmarkRouter from "./routes/bookmark.routes.js";
import messageRouter from "./routes/message.routes.js";
import notificationRouter from "./routes/notification.routes.js";
// --- NEW CODE: DECLARE API ROUTES ---
app.use("/api/v1/users", userRouter);
app.use("/api/v1/startups", startupRouter);
app.use("/api/v1/admin", adminRouter);
app.use("/api/v1/investments", investmentRouter);
app.use("/api/v1/bookmarks", bookmarkRouter);
app.use("/api/v1/notifications", notificationRouter);
app.use("/api/v1/messages", messageRouter);
export {app}

