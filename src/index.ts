import express, {Request, Response} from "express";
export const app = express();
import apiRoutes from "./apiRoutes";

const port = 3001;

app.use(express.json());
app.use("/", apiRoutes);

app.listen(port, () => {
    console.log(`Port is running on port ${port}`);
})