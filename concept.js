'use strict'

function help() {
    console.log('x','delete selected')
    console.log('c','conceptualize')
    console.log('enter','create keyword')
    console.log('i','create info')
}

// -------------------------------------------------------------------------------- DATA

var bm = new BoolMaster('boolMaster/api.php')
var gsi = new GoogleSignIn()
var GX_concepts = {}

var associated_keys = ['']

// -------------------------------------------------------------------------------- DATA INFO

async function get_selected(item_name) {
    if(! await bm.key_exists(item_name))
        await bm.write_key(item_name,null)
    return await bm.read_key(item_name)
}

async function set_selected(item_name, value) {
    await bm.write_key(item_name,value)
}

async function get_selected_concept() {
    let concept_name = await get_selected('selected_concept')
    if(concept_name == null)
        return null
    return await get_concept(concept_name)
}

async function set_selected_concept(concept) {
    let name = null
    if(concept != null)
        name = concept.name
    await set_selected('selected_concept',name)
}

async function get_GX_track() {
    let retr = await get_selected('GX_track')
    if(retr == null) {
        await set_GX_track({})
        return get_GX_track()
    }
    return retr
}

async function set_GX_track(GX_track) {
    await set_selected('GX_track',GX_track)
}

async function get_current_work() {
    let work_name = await get_selected('current_work')
    if(work_name == null)
        return work_name
    return (await get_work_list())[work_name]
}

async function set_current_work(work_name) {
    await set_selected('current_work',work_name)
}

function get_concept_name() {
    return 'concepts'
}

async function get_selected_work() {
    let work_name = await get_selected('work')
    if(work_name == null)
        return work_name
    return (await get_work_list())[work_name]
}

async function set_selected_work(workname) {
    await set_selected('work',workname)
}

async function get_selected_keyword() {
    return await get_selected('keyword')
}

async function set_selected_keyword(keyword) {
    await set_selected('keyword',keyword)
}

async function get_selected_info() {
    return await get_selected('info')
}

async function set_selected_info(info) {
    await set_selected('info',info)
}


// -------------------------------------------------------------------------------- HANDLERS

var key_actions = {
    'KeyX':async function() {
        let work = await get_selected_work()
        if(work != null) {
            if(confirm('Do you realy want to remove "'+work.name+'"'))
                await remove_work(work)
            return
        }
        let concept = await get_selected_concept()
        if(concept == null)
            return null
        let keyword = await get_selected_keyword()
        let info = await get_selected_info()
        if(keyword == null && info==null) {
            if(! confirm('do you really want to remove "'+concept.name+'"'))
                return
            await set_selected_concept(null)
            await remove_concept(concept.name)
        } else {
            let array = keyword==null?'infos':'keywords'
            let type = keyword==null?'info':'keyword'
            let word = keyword==null?info:keyword
            let index = concept[array].indexOf(word)
            concept[array].splice(index,1)
            await set_selected(type,null)
            await set_concept(concept)
        }
    },
    'KeyL':async function() {
        let concept = await get_selected_concept()
        if(concept == null)
            return null
        window.open(concept.url, '_blank');
    },
    'Enter':async function() {
        let work = await get_selected_work()
        if(work != null) {
            await set_current_work(work.name)
            draw_concepts(work)
            return
        }
        let concept = await get_selected_concept()
        if(concept == null)
            return null
        if(concept.keywords.length == 10) {
            alert('Enought keywords')
            return
        }
        let keyword = prompt('keyword','')
        if(keyword == null)
            return null
        concept.keywords.push(keyword)
        await set_selected_info(null)
        await set_selected_keyword(keyword)
        await set_concept(concept)
    },
    'KeyI':async function() {
        let concept = await get_selected_concept()
        if(concept == null)
            return null
        if(concept.infos.length == 9) {
            alert('Enought infos')
            return
        }
        let info = prompt('info','')
        if(info == null)
            return null
        concept.infos.push(info)
        await set_selected_info(info)
        await set_selected_keyword(null)
        await set_concept(concept)
    },
    'KeyC':async function() {
        let concept = await get_selected_concept()
        let keyword = await get_selected_keyword()
        if(concept == null || keyword == null)
            return null
        let cor_concept = await get_concept(keyword)
        if(cor_concept == null) {
            cor_concept = prompt_new_concept(keyword)
            if(cor_concept == null) {
                return null
            }
            await set_selected_concept(cor_concept)
            await set_concept(cor_concept)
        } else {
            await select_concept(cor_concept.name)
        }
    }
}

$(document).keypress(async function(e) {
    let code = e.originalEvent.code
    if(!key_actions.hasOwnProperty(code))
        return
    await key_actions[code]()
})

// -------------------------------------------------------------------------------- WORKS

async function get_work_list() {
    if(! await bm.key_exists('works')) {
        await bm.write_key('works',{})
    }
    return await bm.read_key('works')
}

async function set_work(work_name, work_description) {
    let works = await get_work_list()
    let work = {
        name:work_name,
        description:work_description
    }
    works[work_name] = work
    await bm.write_key('works',works)
}

async function remove_work(work) {
    let old_prefix = bm.get_prefix()

    await set_work_prefix(work)
    await bm.key_remove(get_concept_name())
    await bm.key_remove('selected')

    bm.set_prefix(old_prefix)
    let works = await get_work_list()
    delete works[work.name]
    await bm.write_key('works',works)
}

async function set_work_prefix(work) {
    let profile = await gsi.get_profile_data()
    bm.set_prefix(profile.id+work.name)
}

async function set_profile_prefix() {
    let profile = await gsi.get_profile_data()
    bm.set_prefix(profile.id)
}

// -------------------------------------------------------------------------------- CONCEPTS

async function get_concepts() {
    if(! await bm.key_exists(get_concept_name())) {
        await save_concepts({})
    }
    let concepts = await bm.read_key(get_concept_name())
    return concepts
}

async function save_concepts(concept) {
    await bm.write_key(get_concept_name(),concept)
    await bm.trigger_checker(get_concept_name())
}

async function set_concept(concept) {
    let concepts = await get_concepts()
    concepts[concept.name] = concept
    await save_concepts(concepts)
}

async function get_concept(name) {
    let concepts = await get_concepts()
    if(! concepts.hasOwnProperty(name))
        return null
    return concepts[name]
}

async function remove_concept(name) {
    let concepts = await get_concepts()
    delete concepts[name]
    await save_concepts(concepts)
}

// -------------------------------------------------------------------------------- GX

async function select_concept(concept_name) {
    await GX_concepts[concept_name].select()
}

async function unselect_concept(concept_name) {
    await GX_concepts[concept_name].unselect()
}

// -------------------------------------------------------------------------------- GX**

function GX_create_caps(indata, type) {
    let caps_GX = $('<div>').addClass(type+' caps')
    .html(indata)

    async function manage_selection() {
        let selected_name = await get_selected(type)
        if(selected_name == indata)
            caps_GX.addClass('selected')
    }
    manage_selection()

    caps_GX.click(async function(){

        let was_selected = caps_GX.hasClass('selected')
        for(let kwgx of $.find('.caps.selected')) {
            $(kwgx).removeClass('selected')
        }
        if(was_selected) {
            caps_GX.removeClass('selected')
            await set_selected(type,null)
        }
        else {
            caps_GX.addClass('selected')
            await set_selected(type,indata)
        }
    })

    return caps_GX
}

function GX_create_info(info) {
    let info_GX = GX_create_caps(info, 'info')
    info_GX.click(function(){
        set_selected_keyword(null)
    })
    return info_GX
}

function GX_create_keyword(keyword) {
    let keyword_GX = GX_create_caps(keyword, 'keyword')
    keyword_GX.click(function(){
        set_selected_info(null)
    })
    return keyword_GX
}

function GX_create_concept_name(concept_name) {
    let name_GX = $('<div>').addClass('conceptName')
    .html($('<span>').html(concept_name))
    return name_GX
}

function GX_create_concept(concept) {

    let concept_name = concept.name

    let innib = false

    let concept_GX = $('<div>').addClass('concept')

    async function ret_gtx() {
        let gxt = await get_GX_track()
        if(gxt.hasOwnProperty(concept_name)) {
            concept_GX.css(gxt[concept_name])
        }   
    }
    ret_gtx()

    let name_GX = GX_create_concept_name(concept_name)
    let data_GX = $('<div>').addClass('conceptData')

    let infos_GX = $('<div>').addClass('conceptInfos')
    let keywords_GX = $('<div>').addClass('conceptKeyWords')

    data_GX.append(infos_GX).append(keywords_GX)
    concept_GX.append(name_GX,data_GX)

    register_concept_checker(concept_name,function(new_concept,still_here) {
        if(!still_here) {
            concept_GX.css('animation','concept_disap 0.3s')
            setTimeout(function(){
                concept_GX.remove()
            },300)
            
            return
        }
        let infos = new_concept.infos
        let keywords = new_concept.keywords
        infos_GX.html('')
        keywords_GX.html('')
        for(let info of infos)
            infos_GX.append(GX_create_info(info))
        for(let keyword of keywords)
            keywords_GX.append(GX_create_keyword(keyword))
    })
    
    concept_GX.draggable({
        handle:name_GX,
        stop: async function() {
            async function save_gxt() {
                let left = concept_GX.css('left')
                let top = concept_GX.css('top')
                let gxt = await get_GX_track()
                gxt[concept_name] = {left:left,top:top}
                await set_GX_track(gxt)
            }
            save_gxt()
            innib = true
        }
    })

    async function select_method(e) {
        for(let concGX of $('.concept.selected')) {
            $(concGX).removeClass('selected')
        }
        concept_GX.addClass('selected')
        let pre_selected = await get_selected_concept()
        if(pre_selected != null && pre_selected.name != concept_name) {
            await unselect_concept(pre_selected.name)
        }
        await set_selected_concept(concept)
    }

    async function unselect_method() {
        concept_GX.removeClass('selected')
        await set_selected_concept(null)
        await set_selected_keyword(null)
        await set_selected_info(null)
        $('.caps.selected').removeClass('selected')
    }

    name_GX.click(function(e) {
        if(innib) {
            innib = false
            return
        }
        if(concept_GX.hasClass('selected')) {
            unselect_method()
        } else {
            select_method()
        }
    })

    GX_concepts[concept_name] = {
        select:select_method,
        unselect:unselect_method,
        selected:false
    }

    return concept_GX

}

function prompt_new_concept(name, url='') {
    let concept_name = prompt('concept name',name)
    if(concept_name == null)
        return null
    let concept_url = prompt('concept url',url)
    if(concept_url == null)
        return null
    let concept = {
        name:concept_name,
        url:concept_url,
        infos:[],
        keywords:[]
    }
    return concept
}

function GX_create_profile_elements(profile) {

    let disconnect_btn = $('<div>').addClass('user_btn roundBtn')
    .css('background-image','url("'+profile.image_url+'")')

    disconnect_btn.click(async function(){
        await gsi.disconnect()
        location.reload()
    })

    let elements = {
        disconnect_btn:disconnect_btn
    }
    return elements
}

function GX_create_work(work) {
    let gx = GX_create_caps(work.name,'work')
    return gx
}

// -------------------------------------------------------------------------------- UPDATERS

var concept_checkers = {}
var updid = null

function register_concept_checker(concept_name,callback) {

    if(!concept_checkers.hasOwnProperty(concept_name)) {
        let checker = {
            last_data:'',
            callbacks:[]
        }
        concept_checkers[concept_name] = checker
    }
    concept_checkers[concept_name].callbacks.push(callback)
    
    async function launch_cb() {
        let concept = await get_concept(concept_name)
        callback(concept,true)
    }
    launch_cb()
}

async function init_updater(createBtn) {

    async function init_concept(concept) {
        let concept_GX = GX_create_concept(concept)
        $('.concepts').append(concept_GX)
    }

    function update_add_btn(concepts) {
        if(Object.keys(concepts).length == 0) {
            createBtn.addClass('center')
        } else {
            createBtn.removeClass('center')
        }
    }

    await get_concepts()
    await stop_updater()
    updid = await bm.register_checker(get_concept_name(),async function(concepts) {
        update_add_btn(concepts)
        for(let name in concepts) {
            let concept = concepts[name]
            if(!concept_checkers.hasOwnProperty(name)) {
                init_concept(concept)
            } else {
                let checker = concept_checkers[name]
                let last_data = checker.last_data
                let new_data = JSON.stringify(concept)
                let callbacks = checker.callbacks
                if(last_data != new_data) {
                    for(let cb of callbacks)
                        cb(concept,true)
                }
                checker.last_data = new_data
            }
        }

        let to_delete = []
        for(let check_name in concept_checkers) {
            if(!concepts.hasOwnProperty(check_name)) {
                let callbacks = concept_checkers[check_name].callbacks
                for(let cb of callbacks)
                    cb(null,false)
                to_delete.push(check_name)
            }
        }

        for(let name of to_delete)
            delete concept_checkers[name]
    
        let selected = await get_selected_concept()
        if(selected != null) {
            console.log('selected = ',selected)
            await select_concept(selected.name)
        }
    })

}

async function stop_updater() {
    await bm.unregister_checker(updid)
    concept_checkers = {}
}

// -------------------------------------------------------------------------------- CORE

async function setup_user_profile() {

    await gsi.init_api('1070660703362-s25lhmm8qb29cf0j8bgae19cbp7f8eou.apps.googleusercontent.com')
    let signin_btn = gsi.get_JQ_button().css('display','none')
    setTimeout(function(){
        signin_btn.css('display','block')
    },2000)
    $('.options').append(signin_btn)
    let profile = await gsi.get_profile_data()
    signin_btn.remove()
    return profile
}

async function open_work(work_name) {
    await set_selected
}

// --------------------

var work_list_reg_id = null
var list_btn = null

async function draw_work_list() {

    await set_profile_prefix()
    await set_current_work(null)

    list_btn.click(async function() {
        let work = prompt('work name','')
        if(work == null)
            return null
        await set_work(work,'')
    })

    await get_work_list()
    await bm.unregister_checker(work_list_reg_id)
    work_list_reg_id = await bm.register_checker('works',function(works) {
        $('.concepts').html('')
        if(Object.keys(works).length == 0)
            list_btn.addClass('center')
        else
            list_btn.removeClass('center')
        for(let name in works) {
            let work = works[name]
            let gx = GX_create_work(work)
            $('.concepts').append(gx)
            gx.click(async function() {
                list_btn.unbind('click')
                list_btn.removeClass('center')
            })
        }
    })

    bm.trigger_checker('works')
}

async function draw_concepts(work) {

    await bm.unregister_checker(work_list_reg_id)
    await set_work_prefix(work)

    $('.concepts').html('')

    list_btn.addClass('right')
    list_btn.click(async function() {
        list_btn.unbind('click')
        list_btn.removeClass('right')
        createBtn.remove()
        await stop_updater()
        draw_work_list()
    })

    let createBtn = $('<div>').addClass('createBtn roundBtn')
    $('.options').append(createBtn)
    createBtn.click(async function() {
        let concept = prompt_new_concept('New Concept')
        if(concept == null)
            return null
        await set_selected_concept(concept)
        await set_concept(concept)
    })

    await init_updater(createBtn)
}

// --------------------

async function main() {

    $('.options').html('')
    $('.concepts').html('')

    let profile = await setup_user_profile()

    let gx_prof_elms = GX_create_profile_elements(profile)
    $('.options').append(gx_prof_elms.disconnect_btn)

    list_btn = $('<div>').addClass('listBtn roundBtn')
    $('.options').append(list_btn)

    await set_profile_prefix()
    let current_work = await get_current_work()

    if(current_work == null) {
        draw_work_list()
    } else {
        draw_concepts(current_work)
    }
}

main()