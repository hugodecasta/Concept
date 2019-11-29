'use strict'

function help() {
    console.log('x','delete selected')
    console.log('c','conceptualize')
    console.log('enter','create keyword')
    console.log('i','create info')
}

// -------------------------------------------------------------------------------- DATA

var bm = new BoolMaster('boolMaster/api.php')
var GX_concepts = {}

// -------------------------------------------------------------------------------- DATA INFO

function get_selected(item_name) {
    return localStorage.getItem(item_name)
}

function set_selected(item_name, selected) {
    if(selected == null) {
        localStorage.removeItem(item_name)
        return
    }
    localStorage.setItem(item_name,selected)
}

function set_selected_caps(type,cap_name) {
    set_selected('caps_type',type)
    set_selected('caps',cap_name)
}

async function get_selected_concept() {
    let name = get_selected('selected_concept')
    if(name == null)
        return null
    return await get_concept(name)
}

function set_selected_concept(concept_name) {
    set_selected('selected_concept',concept_name)
}

function get_GX_track() {
    let retr = localStorage.getItem('GX_track')
    if(retr == null) {
        set_GX_track({})
        return get_GX_track()
    }
    return JSON.parse(retr)
}

function set_GX_track(GX_track) {
    localStorage.setItem('GX_track',JSON.stringify(GX_track))
}

// -------------------------------------------------------------------------------- HANDLERS

var key_actions = {
    'KeyX':async function() {
        let concept = await get_selected_concept()
        if(concept == null)
            return null
        let caps_type = await get_selected('caps_type')
        let caps = await get_selected('caps')
        if(caps_type == null) {
            if(! confirm('do you really want to remove "'+concept.name+'"'))
                return
            await remove_concept(concept.name)
        } else {
            let array = caps_type=='info'?'infos':'keywords'
            let index = concept[array].indexOf(caps)
            concept[array].splice(index,1)
            await set_concept(concept)
        }
    },
    'Enter':async function() {
        let concept = await get_selected_concept()
        if(concept == null)
            return null
        let keyword = prompt('keyword','')
        if(keyword == null)
            return null
        concept.keywords.push(keyword)
        await set_concept(concept)
        set_selected_caps('keyword',keyword)
    },
    'KeyI':async function() {
        let concept = await get_selected_concept()
        if(concept == null)
            return null
        let info = prompt('info','')
        if(info == null)
            return null
        concept.infos.push(info)
        await set_concept(concept)
        set_selected_caps('info',info)
    },
    'KeyC':async function() {
        let concept = await get_selected_concept()
        let caps_type = await get_selected('caps_type')
        let keyword = await get_selected('caps')
        if(concept == null || keyword == null || caps_type != 'keyword')
            return null
        let cor_concept = await get_concept(keyword)
        if(cor_concept == null) {
            cor_concept = prompt_new_concept(keyword)
            if(cor_concept == null) {
                return null
            }
            await set_concept(cor_concept)
            set_selected_concept(cor_concept.name)
        } else {
            select_concept(cor_concept.name)
        }
    }
}

$(document).keypress(async function(e) {
    let code = e.originalEvent.code
    if(!key_actions.hasOwnProperty(code))
        return
    await key_actions[code]()
})

// -------------------------------------------------------------------------------- CONCEPTS

async function get_concepts() {
    if(! await bm.key_exists('concepts')) {
        await save_concepts({})
    }
    return await bm.read_key('concepts')
}

async function save_concepts(concept) {
    await bm.write_key('concepts',concept)
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

function select_concept(concept_name) {
    GX_concepts[concept_name].select()
}

function unselect_concept(concept_name) {
    GX_concepts[concept_name].unselect()
}

// -------------------------------------------------------------------------------- GX**

function GX_create_caps(indata, type) {
    let caps_GX = $('<div>').addClass(type+' caps')
    .html(indata)

    if(get_selected('caps_type') == type && get_selected('caps') == indata)
        caps_GX.addClass('selected')

    caps_GX.click(function(){
        let was_selected = caps_GX.hasClass('selected')
        for(let kwgx of $.find('.caps.selected')) {
            $(kwgx).removeClass('selected')
        }
        if(was_selected) {
            caps_GX.removeClass('selected')
            set_selected('caps_type',null)
            set_selected('caps',null)
        }
        else {
            caps_GX.addClass('selected')
            set_selected('caps_type',type)
            set_selected('caps',indata)
        }
    })

    return caps_GX
}

function GX_create_info(info) {
    let info_GX = GX_create_caps(info, 'info')
    return info_GX
}

function GX_create_keyword(keyword) {
    let keyword_GX = GX_create_caps(keyword, 'keyword')
    return keyword_GX
}

function GX_create_concept_name(concept_name) {
    let name_GX = $('<div>').addClass('conceptName')
    .html($('<span>').html(concept_name))
    return name_GX
}

function GX_create_concept(concept) {

    let concept_name = concept.name
    let infos = concept.infos
    let keywords = concept.keywords

    let innib = false

    let concept_GX = $('<div>').addClass('concept').draggable({
        stop: function() {
            let left = concept_GX.css('left')
            let top = concept_GX.css('top')
            let gxt = get_GX_track()
            gxt[concept_name] = {left:left,top:top}
            set_GX_track(gxt)
            innib = true
        }
    })

    let gxt = get_GX_track()
    if(gxt.hasOwnProperty(concept_name)) {
        concept_GX.css(gxt[concept_name])
    }

    let name_GX = GX_create_concept_name(concept_name)
    let data_GX = $('<div>').addClass('conceptData')

    let infos_GX = $('<div>').addClass('conceptInfos')
    let keywords_GX = $('<div>').addClass('conceptKeyWords')

    data_GX.append(infos_GX).append(keywords_GX)
    concept_GX.append(name_GX,data_GX)

    for(let info of infos)
        infos_GX.append(GX_create_info(info))
        

    for(let keyword of keywords)
        keywords_GX.append(GX_create_keyword(keyword))

    async function select_method(e) {
        let pre_selected = await get_selected_concept()
        if(pre_selected != null)
            unselect_concept(pre_selected.name)
        concept_GX.addClass('selected')
        set_selected_concept(concept_name)
    }

    function unselect_method() {
        concept_GX.removeClass('selected')
        set_selected_concept(null)
        set_selected('caps_type',null)
        set_selected('caps',null)
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
        if(e!=undefined && e.ctrlKey) {
            window.open(concept.url, '_blank');
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

async function main() {

    let createBtn = $('<div>').addClass('createBtn')
    $('.options').append(createBtn)
    createBtn.click(async function() {
        let concept = prompt_new_concept('New Concept')
        if(concept == null)
            return null
        await set_concept(concept)
    })

    let concepts = await get_concepts()
    bm.register_checker('concepts',async function(concepts) {

        $('.concepts').html('')
        if(Object.keys(concepts).length == 0) {
            createBtn.addClass('center')
        } else {
            createBtn.removeClass('center')
        }
        for(let id in concepts) {
            let concept = concepts[id]
            let concept_GX = GX_create_concept(concept,async function(keyword){
                let concepts = await get_concepts()
                if(concepts.hasOwnProperty(keyword)) {
                    select_concept(keyword)
                    return
                }
                let concept = prompt_new_concept(keyword,'')
                if(concept == null)
                    return null
                set_selected_concept(keyword)
                await set_concept(concept)
            })
            $('.concepts').append(concept_GX)
        }
        let selected = await get_selected_concept()
        if(selected != null)
            select_concept(selected.name)
    })
}

main()