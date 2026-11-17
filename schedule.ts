export type HomeInput={year_built:number; hvac_type:string; filter_last_changed:string; heater_type:string; heater_last_serviced:string; gutters:boolean};
const addDays=(date:string,days:number)=>{const d=new Date(`${date}T12:00:00Z`);d.setUTCDate(d.getUTCDate()+days);return d.toISOString().slice(0,10)};
export function schedule(input:HomeInput){
 const tasks=[{code:'filter',title:'Check HVAC air filter',frequency_days:60,next_due:addDays(input.filter_last_changed,60),instructions:'Inspect filter and replace as needed. Adjust for manufacturer guidance and household conditions.'},{code:'heater',title:'Check water heater maintenance',frequency_days:365,next_due:addDays(input.heater_last_serviced,365),instructions:'Follow equipment manufacturer guidance. Sediment flushing and descaling needs vary; use a professional when appropriate.'},{code:'alarms',title:'Test smoke and CO alarms',frequency_days:30,next_due:addDays(new Date().toISOString().slice(0,10),30),instructions:'Follow alarm manufacturer testing and replacement instructions.'}];
 if(input.gutters)tasks.push({code:'gutters',title:'Inspect gutters and downspouts',frequency_days:180,next_due:addDays(new Date().toISOString().slice(0,10),180),instructions:'Check for blockages and drainage issues; avoid unsafe ladder work.'});
 return tasks;
}
