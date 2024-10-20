import express, {Request, Response} from "express";
const app = express();
import apiRoutes from "./apiRoutes";

const port = 3000;

app.use(express.json());
app.use("/", apiRoutes);

app.listen(port, () => {
    console.log(`Port is running on port ${port}`);
})