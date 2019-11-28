'use strict'

// -------------------------------------------------------------------------------- DATA

var bm = new BoolMaster('boolMaster/api.php')
var GX_concepts = {}

// -------------------------------------------------------------------------------- DATA INFO

async function get_selected_concept() {
    let name = localStorage.getItem('selected_concept')
    if(name == null)
        return null
    return await get_concept(name)
}

function set_selected_concept(concept_name) {
    localStorage.setItem('selected_concept',concept_name)
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

$(document).keypress(async function(e) {
    let code = e.originalEvent.code
    if(code == 'KeyK') {
        let cur = await get_selected_concept()
        if(cur == null)
            return null
        let keyword = prompt('keyword','')
        cur.keywords.push(keyword)
        await set_concept(cur)
    } else if(code == 'KeyX'){
        let cur = await get_selected_concept()
        if(cur == null)
            return null
        await remove_concept(cur.name)
    }
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
    return (await get_concepts())[name]
}

async function remove_concept(name) {
    let concepts = await get_concepts()
    delete concepts[name]
    await save_concepts(concepts)
}

// -------------------------------------------------------------------------------- GX

function select_concept(concept_name) {
    GX_concepts[concept_name]()
}

// -------------------------------------------------------------------------------- GX

function GX_create_info(info) {
    let info_GX = $('<div>').addClass('conceptInfo')
    .html(info)
    return info_GX
}

function GX_create_keyword(keyword, selected, cze_meth=function(){}) {
    let keyword_GX = $('<div>').addClass('keyWord')
    .html(keyword)
    if(selected)
        keyword_GX.addClass('selected')
    let conceptBtn = $('<div>').addClass('conceptualizeBtn')
    keyword_GX.append(conceptBtn)

    keyword_GX.click(function(){
        let was_selected = keyword_GX.hasClass('selected')
        for(let kwgx of $.find('.keyWord.selected')) {
            $(kwgx).removeClass('selected')
        }
        if(was_selected)
            keyword_GX.removeClass('selected')
        else
            keyword_GX.addClass('selected')
    })

    conceptBtn.click(function() {
        cze_meth(keyword)
    })

    return keyword_GX

}

function GX_create_concept_name(concept_name) {
    let name_GX = $('<div>').addClass('conceptName')
    .html($('<span>').html(concept_name))
    return name_GX
}

function GX_create_concept(concept, cze_meth=function(){}) {

    let concept_name = concept.name
    let infos = concept.infos
    let keywords = concept.keywords

    let concept_GX = $('<div>').addClass('concept').draggable({
        stop: function() {
            let left = concept_GX.css('left')
            let top = concept_GX.css('top')
            let gxt = get_GX_track()
            gxt[concept_name] = {left:left,top:top}
            set_GX_track(gxt)
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
        keywords_GX.append(GX_create_keyword(keyword, false, cze_meth))

    function select_method(e) {

        let was_selected = concept_GX.hasClass('selected')
        for(let ccgx of $.find('.concept.selected')) {
            $(ccgx).removeClass('selected')
        }
        if(was_selected)
            concept_GX.removeClass('selected')
        else {
            concept_GX.addClass('selected')
            set_selected_concept(concept_name)
        }
        if(e!=undefined && e.ctrlKey) {
            console.log('coucou')
            window.open(concept.url, '_blank');
        }
    }

    name_GX.click(select_method)
    GX_concepts[concept_name] = select_method

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

        console.log('----')

        $('.concepts').html('')
        if(Object.keys(concepts).length == 0) {
            createBtn.addClass('center')
        } else {
            createBtn.removeClass('center')
        }
        for(let id in concepts) {
            console.log(id)
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