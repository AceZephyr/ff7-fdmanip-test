//js has an idiotic definition of the modulus operator where it returns negative results for negative inputs.
function mod(a, b) {
    return (a % b + b) % b;
}


class Field {
    constructor(animations, paths, paths_list, name) {
        this.animations = animations;
        this.paths = paths;
        this.paths_list = paths_list;
        this.name = name;
    }
}

class Animation {
    constructor(name, frames, delays) {
        this.name = name;
        this.frames = frames;
        this.delays = delays;
    }
}

const RNG = [177, 202, 238, 108, 90, 113, 46, 85, 214, 0, 204, 153, 144, 107, 125, 235, 79, 160, 7, 172, 223, 138, 86, 158,
    241, 154, 99, 117, 17, 145, 163, 184, 148, 115, 247, 84, 217, 110, 114, 192, 244, 128, 222, 185, 187, 141, 102,
    38, 208, 54, 225, 233, 112, 220, 205, 47, 74, 103, 93, 210, 96, 181, 157, 127, 69, 55, 80, 68, 120, 4, 25, 44,
    239, 253, 100, 129, 3, 218, 149, 76, 122, 11, 173, 31, 186, 221, 62, 249, 215, 26, 41, 248, 24, 179, 32, 246,
    209, 94, 52, 146, 123, 36, 67, 136, 151, 212, 15, 53, 170, 131, 104, 39, 168, 213, 190, 250, 20, 49, 175, 16, 13,
    216, 106, 206, 35, 97, 243, 61, 164, 8, 51, 227, 169, 56, 230, 147, 29, 28, 240, 14, 135, 89, 101, 130, 188, 255,
    254, 126, 143, 193, 30, 245, 203, 73, 2, 50, 9, 196, 142, 198, 43, 64, 167, 23, 118, 59, 22, 42, 200, 251, 178,
    88, 165, 21, 174, 37, 207, 70, 199, 72, 180, 10, 63, 201, 6, 133, 81, 137, 98, 77, 18, 140, 234, 162, 152, 75,
    121, 111, 92, 71, 48, 27, 231, 197, 34, 156, 232, 150, 58, 228, 124, 224, 105, 161, 183, 5, 57, 116, 1, 159, 189,
    195, 132, 252, 119, 134, 19, 78, 191, 242, 83, 91, 237, 33, 139, 109, 194, 65, 182, 219, 60, 211, 40, 236, 45,
    226, 155, 166, 66, 82, 87, 95, 229, 171, 176, 12];

const CALC_TABLE = [1, 1, 2, 4, 0];
const STONE_VALUES = [1, 17, 33, 49, 65, 81, 97, 113, 129, 145, 161, 177, 193, 209, 225, 241];

const FIELD_CC = new Field([
    new Animation("L", 22, [180, 120, 60]),
    new Animation("R", 22, [180, 120, 60]),
    new Animation("B", 22, [180, 120, 60])
], {"NP": 1058, "UT": 141, "US": 13, "NS": 932}, ["NP", "UT", "US", "NS"], "CC");

const FIELD_LJ = new Field([
    new Animation("L", 33, [240, 180, 120]),
    new Animation("R", 45, [240, 180, 120])
], {"NS": 296, "NP": 316, "RV": 3}, ["NS", "NP", "RV"], "LJ");

const FIELD_DS = new Field([
    new Animation("T", 19, [120, 120, 90, 60]),
    new Animation("M", 19, [90, 90, 60, 120]),
    new Animation("B", 19, [60, 60, 120, 90])
], {"NP": 302, "UT": 92, "RV": 46}, ["NP", "UT", "RV"], "DS");

const FIELD_DT = new Field([
    new Animation("T", 10, [120, 120, 90, 60]),
    new Animation("M", 10, [90, 90, 60, 120])
], {"NP": 475, "UT": 61, "NS": 468, "RV": 6}, ["NP", "UT", "NS", "RV"], "DT");

const FIELD_FF = new Field([
    new Animation("X", 1, [90])
], {"NP": 274}, ["NP"], "FF");


function gen_stone_rng(stone, length) {
    let out = [];
    for (let x = 0; x < length; x++) {
        out[x] = CALC_TABLE[RNG[(x * stone) % RNG.length] % CALC_TABLE.length];
    }
    return out;
}

// return -1 if not in stone, -2 if multiple in stone, otherwise return list value
function find_in_stone(sequence, stone) {
    const stonerng = gen_stone_rng(stone, RNG.length + sequence.length);
    let foundIndex = -1;
    for (let x = 0; x < RNG.length; x++) {
        if (stonerng[x] === sequence[0]) {
            if (sequence.length === 1) {
                if (foundIndex !== -1) {
                    return -2;
                }
                foundIndex = x;
            } else {
                let i = 1;
                while (stonerng[x + i] === sequence[i]) {
                    if (sequence.length <= ++i) {
                        if (foundIndex !== -1) {
                            return -2;
                        }
                        foundIndex = x;
                        break;
                    }
                }
            }
        }
    }
    if (foundIndex === -1) {
        return -1;
    }
    return RNG.indexOf(RNG[((foundIndex + sequence.length) * stone) % RNG.length]);
}

function find_stone_and_list(sequence) {
    let out = null;
    for (let i = 0; i < STONE_VALUES.length; i++) {
        const x = find_in_stone(sequence, STONE_VALUES[i]);
        if (x === -2) {
            return -2;
        }
        if (x !== -1) {
            if (out !== null) {
                return -2;
            }
            out = [STONE_VALUES[i], x];
        }
    }
    return out;
}

function process_field(field, path_name, stone_list, delay) {
    const stone = stone_list[0];
    const total_frames = field.paths[path_name] + delay;
    let curr_list = stone_list[1];
    let frame_total = 0;
    let anim_timers = new Array(field.animations.length);
    anim_timers.fill(0);
    let increments = 0;
    let last_delay = null;
    while (frame_total + Math.max(Math.min(...anim_timers.map(x => x > 0 ? x : Math.max(...anim_timers))), 0) <= total_frames) {
        const frame_increment = Math.min(...anim_timers.map(timer => Math.abs(timer)));
        for (let i = 0; i < anim_timers.length; i++) {
            if (anim_timers[i] === frame_increment) {
                curr_list = (curr_list + stone) % RNG.length;
                increments++;
                anim_timers[i] = -field.animations[i].delays[RNG[curr_list] % field.animations[i].delays.length];
            } else if (anim_timers[i] === -frame_increment) {
                anim_timers[i] = field.animations[i].frames;
            } else {
                if (anim_timers[i] > 0) {
                    anim_timers[i] -= frame_increment;
                } else {
                    anim_timers[i] += frame_increment;
                }
            }
        }
        frame_total += frame_increment;
        if (last_delay === null && Math.min(...anim_timers.map(x => Math.abs(x))) > total_frames - frame_total) {
            last_delay = Math.min(...anim_timers.map(x => Math.abs(x))) - (total_frames - frame_total);
        }
    }
    if (last_delay === null) {
        last_delay = Math.min(...anim_timers.map(x => Math.abs(x)));
    }
    let go = true;
    let f2ni = last_delay;
    while (go) { // find frames to next increment
        const frame_increment = Math.min(...anim_timers.map(timer => Math.abs(timer)));
        for (let i = 0; go && i < anim_timers.length; i++) {
            if (anim_timers[i] === frame_increment) {
                go = false;
                break;
            } else if (anim_timers[i] === -frame_increment) {
                anim_timers[i] = field.animations[i].frames;
            } else {
                if (anim_timers[i] > 0) {
                    anim_timers[i] -= frame_increment;
                } else {
                    anim_timers[i] += frame_increment;
                }
            }
        }
        f2ni += frame_increment;
    }
    return {
        "stone_list": [stone, curr_list],
        "increments": increments,
        "last_delay": last_delay,
        "frames_to_next_increment": f2ni
    };
}

function route_length(route) {
    if (route === null || typeof route[Symbol.iterator] !== 'function') {
        return null;
    }
    let len = 0;
    for (let i = 0; i < route.length; i++) {
        len += route[i].start;
    }
    return len;
}

// sometimes, the full length of a step won't work because it joins multiple increments that each work on their own,
// but in the full route, not all work. the first increment of each step will always work.
// this method fixes those lengths so they should always work, and constructs a full route from the partial route that route_fd_for_increment generates
function fix_lengths(route, fields, path_names, start_sl, field_delays, __target_increments) {
    const stone = start_sl[0];
    const starting_list = start_sl[1];
    let stone_list = [...start_sl];
    let new_route = new Array(fields.length);
    //Construct a route array consisting of all the fields with no manipulation for the non-manipped fields, so their length can be modified
    for (let i = 0, curr_route = 0; i < fields.length; i++) {
        if (curr_route < route.length && route[curr_route].field === i) { // field is present in route
            new_route[i] = Object.assign({}, route[curr_route++]);
        } else { // field is not present in route, is non-manipped.
            const field = fields[i];
            const path_name = path_names[i];
            let pf = process_field(field, path_name, stone_list, field_delays[i]);
            stone_list = pf.stone_list;
            new_route[i] = {
                "manip": false,
                "start": 0,
                "length": pf.frames_to_next_increment,
                "increments": pf.increments,
                "target_increment": null,
                "increments_off": null,
                "field": i,
                "path_name": path_names[i],
                "start_sl": null,
                "current_field_increment_frames": null,
                "current_field_list_vals": null
            }
        }
    }
    let data = [new_route.length];
    let starting_incrs = [0];
    //loop through fields
    for (let i = 0; i < new_route.length; i++) {
        const curr_route_field = new_route[i];
        const fidx = curr_route_field.field;
        let field_data = {};
        let ending_incrs = new Set();
        // let least_incr_diff = null;
        // for each possible starting increment
        for (let j = 0; j < starting_incrs.length; j++) {
            const incr = starting_incrs[j];
            const list = (starting_list + stone * incr) % RNG.length;
            const sl = [stone, list];
            const length = curr_route_field.length + field_delays[i];
            let incr_data = {};
            let next_delay = field_delays[i];
            // for each delay
            for (let k = 0; next_delay < length; k++) {
                const pf = process_field(fields[fidx], path_names[fidx], sl, next_delay);
                const total_increments = starting_incrs[j] + pf.increments;
                const delay_length = Math.min(pf.frames_to_next_increment, length - next_delay);
                incr_data[next_delay + curr_route_field.start] = [total_increments, delay_length];
                next_delay += pf.frames_to_next_increment;
                ending_incrs.add(total_increments);
            }
            field_data[starting_incrs[j]] = incr_data;
        }
        starting_incrs = [...ending_incrs].sort((a, b) => a - b);
        data[i] = field_data;
    }
    const target_offset = Math.min(...starting_incrs) - Math.min(...__target_increments);
    let target_increments = new Set([...__target_increments].map(a => a + target_offset));
    console.log(data);
    // iterate through fields in reverse, finding all the bad increments
    for (let i = new_route.length - 1; i >= 0; i--) {
        let _target_increments = new Set();
        let field_length = null;
        // iterate through all starting increments in order
        for (let start_incr of Object.keys(data[i]).map(a => parseInt(a)).sort((a, b) => a - b)) {
            let this_length = 0;
            // iterate through all delays in order
            for (let delay_frames of Object.keys(data[i][start_incr]).map(a => parseInt(a)).sort((a, b) => a - b)) {
                const total_increments = data[i][start_incr][delay_frames][0];
                const delay_length = data[i][start_incr][delay_frames][1];
                if (target_increments.has(total_increments)) {
                    _target_increments.add(start_incr);
                    this_length += delay_length;
                } else {
                    break;
                }
            }
            // if this delay's length is shorter, we can only go up to that length.
            if (this_length > 0 && (field_length === null || this_length < field_length)) {
                field_length = this_length;
            }
        }
        new_route[i].length = field_length;
        target_increments = _target_increments;
    }
    // console.log(new_route);
    return new_route;
}

function route_alts(possible_alts, fields, path_names, stone_list, field_delays, target_increment) {
    let best_alt = null;
    for (let i = 0; i < possible_alts.length; i++) {
        let field = possible_alts[i][0];
        let this_alt_field_delays = [...field_delays];
        let min_ti = Math.min(...target_increment);
        let this_alt_target_increment = [...target_increment].map(a => a - min_ti + field.increments_off);
        let this_alt_start_field = field.field;
        this_alt_field_delays[field.field] += field.start;
        let alt_route = route_fd_for_increment(fields, path_names, stone_list, this_alt_field_delays, this_alt_target_increment, null, this_alt_start_field);
        if (alt_route === null || alt_route === false) {
            continue;
        }
        alt_route.unshift(field);
        if (best_alt === null || route_length(alt_route) < route_length(best_alt)) {
            best_alt = alt_route;
        }
    }
    return best_alt;
}

function route_fd_for_increment(fields, path_names, stone_list, field_delays, target_increment, min_frames = null, start_field = 0) {
    if (typeof target_increment === "number") {
        target_increment = new Set([target_increment]);
    } else if (typeof target_increment[Symbol.iterator] === "function") {
        target_increment = new Set(target_increment);
    }
    const min_target_increment = Math.min(...target_increment);
    const max_target_increment = Math.max(...target_increment);
    if (min_target_increment > 200) {
        //waaay too far away, don't even attempt.
        return false;
    }
    let curr_min_frames = min_frames;
    let possible_alts = [];
    for (let i = start_field; i < fields.length; i++) {
        let curr_increment = 0;
        let start_sl = [...stone_list];
        for (let j = 0; j < i; j++) { // go through the fields before the current one with no extra delay (can do this before the loop and just worry about screens during and after the current screen)
            start_sl = process_field(fields[j], path_names[j], start_sl, field_delays[j]).stone_list;
        }
        let initial_increment = null;
        let frame_count = 0;
        let closest_increment = 0;
        let closest_increment_start_frame = 0;
        let closest_increment_length = 0;
        let current_field_increment = null;
        let current_field_list_vals = {};
        while (curr_increment <= min_target_increment && (curr_increment <= max_target_increment || curr_min_frames === null || frame_count <= curr_min_frames[0].start)) { // advance either until we get to the increment or we're slower than the best solution found so far
            let x = process_field(fields[i], path_names[i], start_sl, field_delays[i] + frame_count); //go through the screen normally with no delay, then add the current amount of delay
            let curr_sl = x.stone_list;
            let incrs = x.increments;
            if (current_field_increment === null || current_field_increment !== incrs) {
                current_field_increment = incrs;
                if (!Object.values(current_field_list_vals).includes(x.stone_list[1])) {
                    current_field_list_vals[frame_count] = x.stone_list[1];
                }
            }
            for (let j = i + 1; j < fields.length; j++) { // go through the fields after the current one with no extra delay
                let y = process_field(fields[j], path_names[j], curr_sl, field_delays[j]);
                curr_sl = y.stone_list;
                incrs += y.increments;
            }
            if (initial_increment === null) {
                initial_increment = incrs;
            } else {
                curr_increment = incrs - initial_increment;
            }
            if (curr_increment > max_target_increment || (target_increment.has(closest_increment) && !target_increment.has(curr_increment))) { // end of the window, exit and use the data currently in closest_increment variables
                break;
            } else if (curr_increment > closest_increment && curr_increment <= min_target_increment) {
                // a closer increment than the current closest, replace it and reset start and length (except if both are in the target_increment set)
                closest_increment = curr_increment;
                closest_increment_start_frame = frame_count;
                closest_increment_length = 0;
                current_field_list_vals = {};
                current_field_list_vals[frame_count] = x.stone_list[1];
            }
            if (curr_increment === closest_increment || (target_increment.has(curr_increment) && target_increment.has(closest_increment))) {
                // advance frames on the closest increment if we are within the window of target_increment
                closest_increment_length += x.last_delay;
            }
            frame_count += x.last_delay; // not yet at the target increment
        }
        if (curr_min_frames !== null && (closest_increment_start_frame > curr_min_frames[0].start)) { // you're too slow!
            continue;
        }
        let current_field_increment_frames = Object.keys(current_field_list_vals).map(a => parseInt(a));
        current_field_increment_frames.pop();
        let manip_data = [{
            "manip": true,
            "start": closest_increment_start_frame,
            "length": closest_increment_length,
            "increments": closest_increment,
            "target_increment": target_increment,
            "increments_off": min_target_increment - closest_increment,
            "field": i,
            "path_name": path_names[i],
            "start_sl": start_sl,
            "current_field_increment_frames": current_field_increment_frames,
            "current_field_list_vals": current_field_list_vals
        }]
        if (target_increment.has(closest_increment)) {
            curr_min_frames = manip_data;
        } else if (closest_increment_start_frame !== 0) { // it's not exactly a possible alternative candidate if you wait zero frames
            possible_alts.push(manip_data);
        }
    }
    if (possible_alts.length > 0) {
        let possible_alt = route_alts(possible_alts, fields, path_names, stone_list, field_delays, target_increment);
        let alt_frames = route_length(possible_alt);
        if (possible_alt !== null && alt_frames !== null && alt_frames < curr_min_frames[0].start) {
            curr_min_frames = possible_alt;
        }
    }
    // console.log("min frames:")
    // console.log(curr_min_frames)
    // console.log("possible alts:")
    // console.log(possible_alts);
    return curr_min_frames;
}

const PLATFORMS = 13;

function fd_from_stone_list(sl) {
    let out = [PLATFORMS]
    let a = 1;
    for (let i = 0; i < PLATFORMS; i++) {
        out[i] = RNG[(sl[1] + (i + a) * sl[0]) % RNG.length] > 180 ? 1 : 0;
        a += out[i];
    }
    return out;
}

const fields_map = {"CC": FIELD_CC, "LJ": FIELD_LJ, "DS": FIELD_DS, "DT": FIELD_DT, "FF": FIELD_FF}
const fields_list = [FIELD_CC, FIELD_LJ, FIELD_DS, FIELD_DT, FIELD_FF];

function delete_cookies() {
    let res = document.cookie;
    let multiple = res.split(";");
    for (let i = 0; i < multiple.length; i++) {
        let key = multiple[i].split("=");
        document.cookie = key[0] + " =; expires = Thu, 01 Jan 1970 00:00:00 UTC";
    }
}

function serialize_cookies() {
    delete_cookies();
    let elems = $("#nc-input").children().get();
    for (let i = 0; i < elems.length; i++) {
        let cookie = [$(elems[i]).find(".nc-screen-select").val(),
            $(elems[i]).find(".nc-path-select").val(),
            $(elems[i]).find(".nc-steps-input").val(),
            $(elems[i]).find(".nc-frames-input").val()];
        document.cookie = i + "=" + cookie.join("|");
    }
}


function field_remove(event) {
    $(this).parent().remove();
    serialize_cookies();
}

function field_select(event) {
    let nc_path_select = $(this).parent().find(".nc-path-select");
    nc_path_select.children().remove();
    let f = fields_map[this.value];
    for (let i = 0; i < Object.keys(f.paths).length; i++) {
        let optn = $("<option>");
        optn.text(f.paths_list[i]);
        if (i === 0) {
            optn.attr({"selected": "selected"});
        }
        nc_path_select.append(optn);
    }
    nc_path_select.on("change", path_select);
    serialize_cookies();
}

function path_select(event) {
    serialize_cookies();
}

function steps_input(event) {
    if (this.value.match("^[0-9]*$")) {
        $(this).parent().find(".nc-frames-input").val(Math.ceil(parseInt(this.value) * (30 / 2.67)));
        serialize_cookies();
    }
}

function frames_input(event) {
    if (this.value.match("^[0-9]*$")) {
        serialize_cookies();
    }
}

function add_field(field = "CC", path = "NP", steps = 0, frames = 0, delay = 0) {
    let elem = $("<div class='nc-field'>");
    let button = $("<button>✖</button>");
    button.on("click", field_remove);
    elem.append(button);
    let nc_screen_select = $("<select class='nc-screen-select'>");
    let f = fields_map[field];
    for (let i = 0; i < fields_list.length; i++) {
        let optn = $("<option>");
        optn.text(fields_list[i].name);
        if (f.name === fields_list[i].name) {
            optn.attr({"selected": "selected"})
        }
        nc_screen_select.append(optn);
    }
    nc_screen_select.on("change", field_select);
    elem.append(nc_screen_select);
    let nc_path_select = $("<select class='nc-path-select'>");
    for (let i = 0; i < Object.keys(f.paths).length; i++) {
        let optn = $("<option>");
        optn.text(f.paths_list[i]);
        if (f.paths_list[i] === path) {
            optn.attr({"selected": "selected"});
        }
        nc_path_select.append(optn);
    }
    nc_path_select.on("change", path_select);
    elem.append(nc_path_select);
    elem.append("<span> Steps: </span>");
    let step_input = $("<input type='number' class='nc-steps-input'>");
    step_input.on("input", steps_input);
    if (steps > 0) {
        step_input.val(steps);
    }
    elem.append(step_input);
    elem.append("<span> Frames: </span>");
    let frame_input = $("<input type='number' class='nc-frames-input'>");
    frame_input.on("input", frames_input);
    if (frames > 0) {
        frame_input.val(frames);
    }
    elem.append(frame_input);
    elem.append("<span> Delay: </span>");
    let delay_input = $("<input type='number' class='nc-delay-input'>");
    if (delay > 0) {
        delay_input.val(delay);
    }
    elem.append(delay_input);
    $("#nc-input").append(elem);
    serialize_cookies();
}

function add_delay_to_field(field_index, field_name, path_name, frames) {
    let field_html = $(`#nc-input>.nc-field:nth-child(${field_index+1})`);
    // check field and path are still the same
    if (field_name === field_html.find(".nc-screen-select").val() && path_name === field_html.find(".nc-path-select").val()) {
        let current_delay = field_html.find(".nc-delay-input").val();
        if (current_delay.length !== 0) {
            current_delay = parseInt(current_delay);
        } else {
            current_delay = 0;
        }
        current_delay += parseInt(frames);
        field_html.find(".nc-delay-input").val(current_delay);
    }
}

let last_click = null;
let input_box = document.querySelector("#timer-input");


function click_timer() {
    const now = new Date().getTime();
    if (last_click !== null) {
        let diff = Math.floor((now - last_click) / 1000);
        if (diff === 0 || diff === 1 || diff === 2 || diff === 4) {
            input_box.value += diff
        } else if (diff === 3) {
            input_box.value += "*"
        } else {
            input_box.value += "?"
        }
    } else {
        input_box.value = "";
    }
    last_click = now;
}


function reset_timer() {
    last_click = null;
    input_box.value = "";
}

const output_before_current_list = 5;
const truncate_input = 11;
const max_incrs = 20

function timer_calculate() {
    let input = input_box.value.replaceAll(" ", "");
    if (input.length > truncate_input) {
        input = input.substr(input.length - truncate_input);
    }
    if (!input.match("^[0124]*$")) {
        alert("Invalid Input.");
        return;
    }
    let sequence = input.split("").map(x => parseInt(x));
    let sl = find_stone_and_list(sequence);
    if (sl === null) {
        alert("No match found.");
        return;
    }
    if (sl === -2) {
        alert("More than one match found.");
        return;
    }
    let initial_sl = [...sl];
    let flds = $(".nc-field");
    let path_names = [flds.length];
    let field_delays = [flds.length];
    let fields = [flds.length];
    for (let i = 0; i < flds.length; i++) {
        let fld = $(flds[i]);
        let field_name = fld.find(".nc-screen-select").val();
        let path_name = fld.find(".nc-path-select").val();
        let frames_ = fld.find(".nc-frames-input").val();
        let delay = fld.find(".nc-delay-input").val();

        if (frames_.length === 0) {
            frames_ = 0;
        } else {
            frames_ = parseInt(frames_);
            if (Number.isNaN(frames_)) {
                alert("frames is not a number!");
                return;
            }
        }
        if (delay.length === 0) {
            delay = 0;
        } else {
            delay = parseInt(delay);
            if (Number.isNaN(delay)) {
                alert("frames is not a number!");
                return;
            }
        }
        let frames = frames_ + delay;
        let field_ = fields_map[field_name];
        fields[i] = field_;
        sl = process_field(field_, path_name, sl, frames).stone_list;
        path_names[i] = path_name;
        field_delays[i] = frames;
    }

    let tbody = $("<tbody>");
    let current_lowest = null;
    let manip_list = $("<ul>");
    let manip_targets = {};
    let num_of_each_battle = new Array(PLATFORMS + 1).fill(0)
    for (let i = 0; i < RNG.length; i++) {
        let currSL = [sl[0], mod(sl[1] + ((i - output_before_current_list) * sl[0]), RNG.length)];
        let fd = fd_from_stone_list(currSL);
        let battle_count = fd.reduce((a, b) => a + b);
        num_of_each_battle[battle_count] += 1;
        let tr = $("<tr>");
        if (i === output_before_current_list) {
            tr.addClass("this_list");
            current_lowest = battle_count;
        } else if (current_lowest !== null && current_lowest > battle_count) {
            manip_targets[battle_count] = new Set([i - output_before_current_list]);
            tr.addClass("manip_option");
            current_lowest = battle_count;
        }
        if (current_lowest !== null) {
            for (let j = battle_count; manip_targets[j] !== undefined; j++) {
                if (manip_targets[j].size < max_incrs) {
                    manip_targets[j].add(i - output_before_current_list);
                }
            }
        }
        let rng_idx = $("<td>");
        rng_idx.text(currSL[1]);
        tr.append(rng_idx);
        let btls = $("<td>");
        btls.text(battle_count);
        tr.append(btls);
        for (let j = 0; j < fd.length; j++) {
            let enka = $("<td class='enka'>");
            if (fd[j] === 1) {
                enka.addClass("black");
                enka.text(j + 1);
            }
            tr.append(enka);
        }
        tbody.append(tr);
    }
    if (num_of_each_battle.reduce((a, b) => a + b) !== RNG.length) {
        alert('error: sum of all stats values not equal to number of list entries');
    } else {
        let stats_tbody = $("<tbody>");
        for (let i = 0; i < num_of_each_battle.length; i++) {
            stats_tbody.append($("<tr>").append($("<th>").text(i)).append($("<td>").text(num_of_each_battle[i])).append($("<td>").append((num_of_each_battle[i] / RNG.length * 100).toFixed(1) + "%")));
        }
        $("#stone-stats").html($("<table>").append("<thead><tr><th>Encs</th><th>#</th><th>%</th></tr></thead>").append(stats_tbody));
    }
    for (const battle_count of Object.keys(manip_targets).map(a => parseInt(a)).sort().reverse()) {
        let target_increments = manip_targets[battle_count];
        let fd_route = route_fd_for_increment(fields_list, path_names, initial_sl, field_delays, target_increments);
        if (fd_route !== null && fd_route !== false) {
            fd_route = fix_lengths(fd_route, fields_list, path_names, initial_sl, field_delays, target_increments);
            let fd_route_text = `${battle_count}:`;
            let j = 0;
            let sl = [...initial_sl];
            let lists = new Set();
            lists.add(initial_sl[1]);
            for (let k = 0; k < fields.length; k++) { // loop through all fields
                if (j < fd_route.length && fd_route[j].field === k) { // is the current field part of the manip?
                    // put the next step here
                    fd_route_text += `<br><button onclick="add_delay_to_field(${k}, '${fields[k].name}', '${path_names[k]}', '${fd_route[j].start + fd_route[j].length}')">Skip</button>`;
                    fd_route_text += ` ${fields[k].name}${path_names[k]}: Wait ${(fd_route[j].start / 30).toFixed(2)}-${((fd_route[j].start + fd_route[j].length - 1) / 30).toFixed(2)} sec. (${fd_route[j].start}-${fd_route[j].start + fd_route[j].length - 1} frames)`;
                    sl = fd_route[j].stone_list;
                    j++;
                } else { // no manip on this, instead calculate and show leniency on this screen
                    let new_lists = {}; // {old list: [new list, frames of leniency]}
                    let min_f2ni = null;
                    for (const listval of lists) {
                        let x = process_field(fields[k], path_names[k], [initial_sl[0], listval], field_delays[k]);
                        new_lists[listval] = [x.frames_to_next_increment, x.stone_list[1]];
                        if (min_f2ni === null || min_f2ni > x.frames_to_next_increment) {
                            min_f2ni = x.frames_to_next_increment;
                        }
                    }
                    lists.clear();
                    for (const val of Object.values(new_lists)) {
                        lists.add(val[0]);
                    }
                    fd_route_text += `<br>${fields[k].name}${path_names[k]} precision: ${min_f2ni} frames`;
                }
            }
            let manip_list_item = $("<li>");
            manip_list_item.html(fd_route_text);
            manip_list.append(manip_list_item);
        }
    }
    let table = $("<table>");
    table.append(`<thead><th>List</th><th>Battles</th><th colspan='13'>Encounters (Stone ${sl[0]})</th></thead>`)
    table.append(tbody);
    $("#manips-output").html(manip_list).prepend("<p>Here are ... my results!!</p>");
    $("#output").html(table);
    $("#output").css({"max-height": window.innerHeight - 8});
}

document.onkeydown = function (event) {
    if (event.code === "Space") {
        if (event.target === document.body) {
            event.preventDefault();
        }
        click_timer();
    } else if (event.code === "Enter" || event.code === "NumpadEnter") {
        timer_calculate();
    } else if (event.code === "Escape") {
        reset_timer();
    }
}

if (document.cookie.length === 0) {
    add_field("CC", "NP");
    add_field("LJ", "NS");
    add_field("DS", "NP");
    add_field("DT", "NP");
    add_field("FF", "NP");
    serialize_cookies();
} else {
    let cookies_split = document.cookie.split(";");
    let cookies = [cookies_split.length];
    for (let i = 0; i < cookies_split.length; i++) {
        let cookie = cookies_split[i].split("=");
        let idx = parseInt(cookie[0]);
        cookies[idx] = cookie[1].split("|");
    }
    for (let i = 0; i < cookies.length; i++) {
        let x = cookies[i];
        add_field(x[0], x[1], parseInt(x[2]), parseInt(x[3]));
    }
}
