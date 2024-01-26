import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class AgentStatusService {

  constructor() { }

  private checkAgentTime (time) {
    const settings = JSON.parse(localStorage.getItem("uis"));
    const agentResponseTime = settings.find(entry => entry.name === "statustimer").value;

    const currentTime = Math.floor(new Date().getTime() / 1000);
    const responseWindow = currentTime - agentResponseTime;

    return time >= responseWindow;
  }

  getWorkingStatus (agent) {
    if(agent.isActive && agent.lastAct === "sendProgress" && this.checkAgentTime(agent.lastTime))
      return true;
    else
      return false;
  }
}
