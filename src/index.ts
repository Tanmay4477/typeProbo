import express, {Request, Response} from "express";
export const app = express();
import apiRoutes from "./apiRoutes";
import { setupClient } from "./engine";

const port = 3001;

app.use(express.json());

setupClient();

app.use("/", apiRoutes);

app.listen(port, () => {
    console.log(`Port is running on port ${port}`);
})