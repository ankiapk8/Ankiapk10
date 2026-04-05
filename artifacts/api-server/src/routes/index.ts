import { Router, type IRouter } from "express";
import healthRouter from "./health";
import decksRouter from "./decks";
import cardsRouter from "./cards";
import generateRouter from "./generate";

const router: IRouter = Router();

router.use(healthRouter);
router.use(decksRouter);
router.use(cardsRouter);
router.use(generateRouter);

export default router;
