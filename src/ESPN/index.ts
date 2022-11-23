import axios from "axios";
import { format } from "date-fns/fp";
import Scoreboard from "./Scoreboard";
import Summary from "./Summary";

const { get } = axios.create({
  baseURL: "https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world",
});

export const scoreboard = (date: Date) =>
  get<Scoreboard>("/scoreboard", {
    params: { dates: format("yyyyMMdd")(date) },
  }).then((res) => res.data);

export const summary = (eventId: string) =>
  get<Summary>("/summary", { params: { event: eventId } }).then(
    (res) => res.data,
  );
