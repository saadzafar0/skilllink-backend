const express = require ("express")
const rootRouter = requrie("./routes/index")
const PORT = 4000;

const app = express();
app.use(cors())
app.use(express.json())

app.use("/api/v1/",rootRouter);


app.listen(PORT,()=>{
    consol.log(`Server is running on PORT ${PORT}`)
});