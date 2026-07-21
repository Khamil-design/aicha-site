const input=document.getElementById("searchInput");

const results=document.getElementById("searchResults");

input.addEventListener("input",function(){

const value=this.value.trim().toLowerCase();

results.innerHTML="";

if(value===""){

results.style.display="none";

return;

}

const found=searchData.filter(item=>{

return(

item.title.toLowerCase().includes(value)||

item.description.toLowerCase().includes(value)||

item.keywords.toLowerCase().includes(value)

);

});

if(found.length===0){

results.innerHTML='<div class="no-result">لا توجد نتائج</div>';

results.style.display="block";

return;

}

found.forEach(item=>{

const div=document.createElement("div");

div.className="search-item";

div.innerHTML=`

<h6>${item.title}</h6>

<p>${item.description}</p>

`;

div.onclick=()=>{

window.location.href=item.url;

};

results.appendChild(div);

});

results.style.display="block";

});

document.addEventListener("click",function(e){

if(!results.contains(e.target)&&e.target!==input){

results.style.display="none";

}

});
