$(document).ready(function(){
  var patterns = new Array();
  var comments = new Array();
  var current_pattern = 0;

  setup();
  render_state();

  function setup()
  {
    var i;
    $("#components").data('noclick', 0);

    // allow the segments to be sorted
    $("#components").sortable({
      placeholder: "ui-state-highlight" ,
      start: function(event, ui) {
        $(this).data('noclick', 1);
      },   
      stop: function() {
        render_state();
        render_list();
      }
    });
    $("#components").disableSelection();
  
    $(".button").button();
    $("#export_dialog").dialog({ autoOpen: false, width: 650, height: 450, modal: true, resizable: false });
    $("#about_dialog").dialog({ autoOpen: false, width: 650, height: 450, modal: true, resizable: false });

    // fade down tiles for unselected
    $("img.tile").fadeTo(0, 0.1);
    // set state to 0
    $("img.tile").data("state", 0); 
    // set the "title" for each tile to show info about segment and pin
    $("img.tile").each(function() {
      $(this).attr("title",  "Segment: " + $(this).data("seg") 
        + " (Pin: " + $(this).data("pin") + ")" ); 
     }); 
    // setup the bit/seg/pins 
    for(i=0;i<16;i++) {
      // setup the labels for the bits
      var bit_label = $("<li/>").appendTo($("#bit_labels"))
      bit_label.text("bit" + (15-i));
      if (i<8) bit_label.addClass("hi-bit-title");
      // create a containing li, set the data about segment 
      var component_container = $("<li class='ui-state-default'/>").appendTo($("#components"));
      var segment_image = lookup_segment_image(i);
      component_container.data("seg", i);
      component_container.data("pin", (segment_image.length > 0 ? segment_image.data("pin") : 0));
      
      // create a component
      var component = $("<div class='component'/>").appendTo(component_container);
      // add text showing segment number
      $("<div/>").appendTo(component).addClass("seg").text((i==0 ? "-" : i));
      // add text showing pin number 
      $("<div/>").appendTo(component).addClass("pin").text((i==0 ? "-" : component_container.data("pin")));
      // set intial state to 0
      component_container.data("state", 0);
      component.addClass("bit_is_0");          
    }
    
    load_default_patterns();
    
    sort_by_segments();
 }

 function sort_by_segments()
 {
  $("#components li").sortElements(function(a, b){
    return $(a).data("seg") > $(b).data("seg") ? -1 : 1;
  });
  render_state();
  render_list();
 }
 
 function sort_by_pins()
 {
  $("#components li").sortElements(function(a, b){
    return $(a).data("pin") > $(b).data("pin") ? -1 : 1;
  });
  render_state();
  render_list();
 }
 
 
  function reverse()
  {
    $("#components li").reverseOrder();
    render_state();
    render_list();
  }
  
 
 // calculate the current pattern to current_pattern
 function serialize_current_pattern()
 {
    var i = 0;
    
    current_pattern = 0;
    $("#components li").each(function() {
      current_pattern += $(this).data("state") * Math.pow(2, $(this).data("seg"));
      i++;
    });
 }
 

 function map_pattern_to_bits(pattern)
 {
    var i = 15;
    var bits = 0;
    var seg;
    $("#components li").each(function() {
      seg = $(this).data("seg");
      bits += ((pattern >> seg) & 0x01) << i;
      i--;
    });
    return bits;
 }
 
  function load_pattern(new_pattern)
  {
    $("img.tile").each(function(){    
      var seg = $(this).data("seg");
      $(this).data("state", (((new_pattern >> seg) & 0x01) ? 1 : 0));
    });
  }


 function render_state() {
    $("img.tile").each(function(){ 
      var state = $(this).data("state");
      var seg = $(this).data("seg");
      
      // fade up or down segment depending on state
      $(this).fadeTo("fast", (state == 1 ? 1 : 0.1));
      // make the components match with the segments
      $("#components li").each(function() {
        if ($(this).data("seg") == seg) {
          $(this).data("state", state);
          var component = $(this).children().first();
          if (state == 0) {
            component.removeClass("bit_is_1");
            component.addClass("bit_is_0");
          } else {
            component.removeClass("bit_is_0");
            component.addClass("bit_is_1");
          }
        }
      });
    }); 
    // serialize and display current pattern
    serialize_current_pattern();
    var bits = map_pattern_to_bits(current_pattern);
    
    $("#value_dec").text(bits);
    $("#value_hex").text(value_as_hex(bits));
    $("#value_bin").text(value_as_binary(bits));
  }

  function render_list()
  {
    var tr, bits;
    var export_code = "";
    
    $("#value_table").children().remove();
    //$("#value_table").text("Values:");
    $.each(patterns, function(index, pattern) {
      bits = map_pattern_to_bits(pattern);
      
      tr = $("<tr/>").appendTo($("#value_table"));
      $("<td width='5%' class='number'/>").appendTo(tr).text(index);
      $("<td width='10%' class='number'/>").appendTo(tr).html("<a href='#' class='action' data-action='show' data-index='" + index + "'>" + bits + "</a>");
      $("<td width='10%' class='number'/>").appendTo(tr).html("<a href='#' class='action' data-action='show' data-index='" + index + "'>" + value_as_hex(bits) + "</a>");
      $("<td width='30%' class='number'/>").appendTo(tr).html("<a href='#' class='action' data-action='show' data-index='" + index + "'>" + value_as_binary(bits) + "</a>");
      $("<td width='40%' class='comment'/>").appendTo(tr).text("// " + comments[index]);
      $("<td width='5%'/>").appendTo(tr).html("<a href='#' class='action' data-action='remove' data-index='" + index + "'>Remove</a>");
      
      
      export_code += value_as_hex(bits) + ", // " + index.toString() + " - " + comments[index] + "\n"
    });
    
    
      
    
    $("#export_text").val("uint16_t pattern[] = {\n" + export_code + "};\n");
  }

  function lookup_segment_image(segment_number)
  {
    return $("img[data-seg='" + segment_number + "']");    
  }

  function toggle_state(segment_image)
  {
    segment_image.data("state",(segment_image.data("state") == 0 ? 1 : 0)); 
  }

  // EVENTS

  // toggle segment when clicked on
  $("img.tile").click(function() {
    toggle_state($(this));
    render_state();
  });
  
  // toggle corresponding segment when component clicked on
  $("#components li").click(function() {
    if ($("#components").data('noclick') == 1) {
      $("#components").data('noclick', 0);
      return;
    }
    toggle_state(lookup_segment_image($(this).data("seg")));
    render_state();
  });
    
  // highlight a segment when hovered over
  $("img.tile").hover(function () {
      $(this).addClass("hilite");
    }, function () {
      $(this).removeClass("hilite");
  });

  // add the current pattern to the list
  $("#add_value").click(function() {
    patterns.push(current_pattern);
    comments.push($("#value_comment").val()); 
    render_list();
    // clear comment ready for next patter
    $("#value_comment").val("");
    $("#value_table_container").animate({ scrollTop: $("#value_table_container").attr("scrollHeight") }, 500);
  });

  // clear the list of patterns
  $("#clear_values").click(function() {
    patterns = new Array();
    comments = new Array();
    render_list();
  });
  
  $("#restore_default_values").click(function() {
    load_default_patterns();
    render_list();
  });
  
 
  $("#export").click(function() {
    var text_area = $("#export_text");
    $("#export_dialog").dialog('open');
    text_area.focus();
    text_area.select();
  });
 
   $("#about").click(function() {
    $("#about_dialog").dialog('open');
  });
 
   // show pattern
  $(".action").live('click', function() {
    switch($(this).data("action")) {
      case "show":
        load_pattern(patterns[$(this).data("index")]);
        render_state();
        break;
      case "remove":
        patterns.splice($(this).data("index"), 1);
        comments.splice($(this).data("index"), 1);
        load_pattern(0x0000);
        render_state();
        render_list();
        break;
    }
    return false;
  });
 
 
 
 
   // fill pattern
  $("#fill_pattern").click(function() {
    $("img.tile").each(function() {
      $(this).data("state", 1); 
     });
    render_state();
  });
  
  // invert pattern
  $("#invert_pattern").click(function() {
    $("img.tile").each(function() {
      $(this).data("state", (($(this).data("state")) == 1 ? 0 : 1)); 
     });
    render_state();
  });  
  
  // clear pattern
  $("#clear_pattern").click(function() {
    $("img.tile").each(function() {
      $(this).data("state", 0); 
     });
    render_state();
  });
  
  $("#sort_segments").click(function() {
    sort_by_segments();
  });
  
  $("#sort_pins").click(function() {
    sort_by_pins();
  });
  
  $("#reverse").click(function() {
    reverse();
  });
  
  // Defaults
  function load_default_patterns()
  {
    patterns = [
      0x446e, // A
      0x151e, // B
      0x0072, // C
      0x111e, // D
      0x4072, // E
      0x4062, // F
      0x047a, // G
      0x446c, // H
      0x1112, // I
      0x003c, // J
      0x4a60, // K
      0x0070, // L
      0x02ec, // M
      0x08ec, // N
      0x007e, // O
      0x4466, // P
      0x087e, // Q
      0x4c66, // R
      0x445a, // S
      0x1102, // T
      0x007c, // U
      0x2260, // V
      0x286c, // W
      0x2a80, // X
      0x2280, // Y
      0x2212, // Z
      0x227e, // 0
      0x1100, // 1
      0x4436, // 2
      0x061a, // 3
      0x444c, // 4
      0x4852, // 5
      0x447a, // 6
      0x2202, // 7
      0x447e, // 8
      0x445e, // 9
      0x7f80, // *
      0x8000  // _      
    ];
    comments = [
      "A", // A
      "B", // B
      "C", // C
      "D", // D
      "E", // E
      "F", // F
      "G", // G
      "H", // H
      "I", // I
      "J", // J
      "K", // K
      "L", // L
      "M", // M
      "N", // N
      "O", // O
      "P", // P
      "Q", // Q
      "R", // R
      "S", // S
      "T", // T
      "U", // U
      "V", // V
      "W", // W
      "X", // X
      "Y", // Y
      "Z", // Z
      "0", // 0
      "1", // 1
      "2", // 2
      "3", // 3
      "4", // 4
      "5", // 5
      "6", // 6
      "7", // 7
      "8", // 8
      "9", // 9
      "*", // *
      "_"  // _      
    ];    
  }
  
});
