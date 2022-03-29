var tasks = {};

var createTask = function (taskText, taskDate, taskList) {
  // create elements that make up a task item
  var taskLi = $("<li>").addClass("list-group-item");
  var taskSpan = $("<span>")
    .addClass("badge badge-primary badge-pill")
    .text(taskDate);
  var taskP = $("<p>").addClass("m-1").text(taskText);

  // append span and p element to parent li
  taskLi.append(taskSpan, taskP);

  // check due date
  auditTask(taskLi);

  // append to ul list on the page
  $("#list-" + taskList).append(taskLi);
};

var loadTasks = function () {
  tasks = JSON.parse(localStorage.getItem("tasks"));

  // if nothing in localStorage, create a new object to track all task status arrays
  if (!tasks) {
    tasks = {
      toDo: [],
      inProgress: [],
      inReview: [],
      done: [],
    };
  }

  // loop over object properties
  $.each(tasks, function (list, arr) {
    console.log(list, arr);
    // then loop over sub-array
    arr.forEach(function (task) {
      createTask(task.text, task.date, list);
    });
  });
};

var saveTasks = function () {
  localStorage.setItem("tasks", JSON.stringify(tasks));
};

// audit task // check task due dates
var auditTask = function(taskEl){

  console.log("auditTask is called");

  //get date from task element
  var date = $(taskEl).find("span").text().trim();

  //convert to moment object at 5:00pm
  // "L" =  user local time
  // .set hour 17 in military time 
  var time = moment(date, "L").set("hour", 17);
  console.log("time set is "+ time);

  // remove any old classes from element
  $(taskEl).removeClass("list-group-item-warning list-group-item-danger");

  // apply new class if task is near/ over due date
  if(moment().isAfter(time)){
    $(taskEl).addClass("list-group-item-danger");
  }
  else if (Math.abs(moment().diff(time, "days")) <= 2){
    $(taskEl).addClass("list-group-item-warning");
  }

};


// on click to <p> in to do list
$(".list-group").on("click", "p", function () {
  var text = $(this).text().trim();
  var textInput = $("<textarea>").addClass("from-control").val(text);
  $(this).replaceWith(textInput);
  textInput.trigger("focus");

  console.log(text);
});
// text area of list group is edited
$(".list-group").on("blur", "textarea", function () {
  var text = $(this).val().trim();

  //get parents ul id
  var status = $(this).closest(".list-group").attr("id").replace("list-", "");

  //get the task postion in the list of other li elements
  var index = $(this).closest(".list-group-item").index();

  tasks[status][index].text = text;
  saveTasks();
  // recreate p element
  var taskP = $("<p>").addClass("m-1").text(text);
  // replace textarea with p element
  $(this).replaceWith(taskP);
});

//due date in list group was clicked// get and update current info
$(".list-group").on("click", "span", function () {
  //get current text
  var date = $(this).text().trim();

  //create new input element
  var dateInput = $("<input>")
    .attr("type", "text")
    .addClass("form-control")
    .val(date);

  //swap out elements
  $(this).replaceWith(dateInput);

  dateInput.datepicker({
    minDate :1,
    onClose: function(){
      // when calendar is closed, force a change event on the dateInput
      $(this).trigger("change");
    }
  });


  //automatically focus on new element
  dateInput.trigger("focus");
});

// on blur// Change
// value of due date was changed
$(".list-group").on("change", "input[type='text']", function () {
  // get current text
  var date = $(this).val().trim();

  // get the parent ul's id attribute
  var status = $(this).closest(".list-group").attr("id").replace("list-", "");

  // get the task's position in the list of other li elements
  var index = $(this).closest(".list-group-item").index();

  // update task in array and re-save to localstorage
  tasks[status][index].date = date;
  saveTasks();

  // recreate span element with bootstrap classes
  var taskSpan = $("<span>")
    .addClass("badge badge-primary badge-pill")
    .text(date);

  // replace input with span element
  $(this).replaceWith(taskSpan);

  auditTask($(taskSpan).closest(".list-group-item"));

});






// sortable

$(".card .list-group").sortable({
  connectWith: $(".card .list-group"),
  scroll: false,
  tolerance: "pointer",
  helper: "clone",
  activate: function (event) {
    console.log("active", this);
    $(this).addClass("dropover");
    $(".bottom-trash").addClass('bottom-trash-drag');
  },
  deactivate: function (event) {
    console.log("deactivate", this);
    $(this).removeClass("dropover")
    $(".bottom-trash").removeClass('bottom-trash-drag');
  },
  over: function (event) {
    console.log("over", event.target);
    $(this).addClass('dropover-active');
  },
  out: function (event) {
    console.log("out", event.target);
    $(this).removeClass('dropover-active');
  },
  // update info into an array
  update: function (event) {
    var tempArr = [];
    //loop over current set of children in sort list
    $(this)
      .children()
      .each(function () {
        var text = $(this).find("p").text().trim();

        var date = $(this).find("span").text().trim();

        // add task data to the temp array as object
        tempArr.push({
          text: text,
          date: date,
        });
      });
    //trim down list ID to match object property
    var arrName = $(this).attr("id").replace("list-", "");
    //update array on tasks object and save
    tasks[arrName] = tempArr;
    saveTasks();
    console.log(tasks);
  },
});

// trash
$("#trash").droppable({
  accept: ".card .list-group-item",
  tolerance: "touch",
  drop: function (event, ui) {
    console.log("drop"), ui.draggable.remove();
  },
  over: function (event, ui) {
    console.log("over");
    $(".bottom-trash").addClass('bottom-trash-active');
  },
  out: function (event, ui) {
    console.log("out");
    $(".bottom-trash").removeClass('bottom-trash-active');
  },
});

// modal was triggered
$("#task-form-modal").on("show.bs.modal", function () {
  // clear values
  $("#modalTaskDescription, #modalDueDate").val("");
});



// modal is fully visible
$("#task-form-modal").on("shown.bs.modal", function () {
  // highlight textarea
  $("#modalTaskDescription").trigger("focus");
});

$("#modalDueDate").datepicker({
  minDate: 1
});


// save button in modal was clicked
$("#task-form-modal .btn-save").click(function () {
  // get form values
  var taskText = $("#modalTaskDescription").val();
  var taskDate = $("#modalDueDate").val();

  if (taskText && taskDate) {
    createTask(taskText, taskDate, "toDo");

    // close modal
    $("#task-form-modal").modal("hide");

    // save in tasks array
    tasks.toDo.push({
      text: taskText,
      date: taskDate,
    });

    saveTasks();
  }
});

// remove all tasks
$("#remove-tasks").on("click", function () {
  for (var key in tasks) {
    tasks[key].length = 0;
    $("#list-" + key).empty();
  }
  saveTasks();
});

// timer interval to run audit Task every 30mins
setInterval(function(){
  $(".card .list-group-item").each(function(index, el){
    auditTask(el);
  });
}, 1800000);




// load tasks for the first time
loadTasks();
