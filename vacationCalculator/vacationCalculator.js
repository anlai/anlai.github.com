$(function(){
	$(".date").datepicker();
	
	$("#calculate").click(function(){Calculate();});
});

// calculate the extra hours needed
function Calculate()
{
	var lastPayDate = new Date($("#lastDatePay").val());
	var timeAccrued = Number($("#timeAccrued").val());
	var timeAccruedMonth = Number($("#timeAccruedMonth").val());
	var startVacation = new Date($("#startVacation").val());
	var endVacation = new Date($("#endVacation").val());
	var hoursPerDay = Number($("#hoursPerDay").val());
	var vacationBetween = Number($("#vacationBetween").val());
	if (isNaN(vacationBetween)) vacationBetween = 0;
			
	// first calculate the total hours available at start of vacation
	var availableBeginning = AvailableHours(lastPayDate, timeAccrued, timeAccruedMonth, startVacation);
	// remove any vacations in between
	availableBeginning = availableBeginning - vacationBetween;
	
	// calculate how many hours will be needed for the vacation
	var hoursNeeded = CalculateNeededHours(startVacation, endVacation, hoursPerDay);
		
	$("#check").hide();
	$("#x").hide();
	
	$("#hours-needed").html("Hours needed: " + hoursNeeded);
	$("#available-hours").html("Available hours: " + availableBeginning);
	
	if (hoursNeeded > availableBeginning)
	{
		var shortHours = hoursNeeded - availableBeginning;
		$("#result-txt").html("not enough hours, you are short by " + shortHours);
		
		$("#x").show();
	}
	else
	{
		$("#result-txt").html("you have enough hours");
		$("#check").show();
	}
}

// calculates how much time will have accrued by the target date of the vacation
function AvailableHours (lastPayDate, timeAccrued, timeAccruedMonth, targetDate)
{
	var diff = targetDate - lastPayDate;
	var months = Math.floor((diff % 31536000000) / 2628000000);
	
	var available = timeAccrued + (months * timeAccruedMonth);
	
	return available;
}

// calculates the required number of hours for the vacation
function CalculateNeededHours(startVacation, endVacation, hoursPerDay)
{
	var businessDays = CalculateBusinessDays(startVacation, endVacation);
	
	return businessDays * hoursPerDay;
}

// calculates the business days, does not adjust for holidays
// date.getDay() = 1 ==> Monday
// date.getDay() = 5 ==> Friday
// date.getDay() = 0 or 6 ==> Weekend, ignore these days
function CalculateBusinessDays(start, end)
{
	// check to make sure dates are in correct order
	if (end < start) return -1;
	
	var calcDate = start;
	var numDays = 0;
	
	// figure out the days
	do {
	
		if (calcDate.getDay() != 0 && calcDate.getDay() != 6)
		{
			numDays++;
		}
		
		calcDate.setDate(calcDate.getDate() + 1);	// increment by 1 day
		
	} while (calcDate <= end);
	
	return numDays;
}