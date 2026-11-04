/* Display ordering and an explicitly saved, staged full-schedule editor. */
(function(root){
    'use strict';
    const escape=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
    const money=value=>new Intl.NumberFormat('ko-KR').format(value);
    let draft=null;
    function sortInstallmentDisplay(items){
        const timestamp=item=>{
            const created=Number(item.createdAt)||Date.parse(item.createdAt||'');
            if(Number.isFinite(created)&&created>0)return created;
            const id=String(item.id).match(/^(\d{12,13})/);
            if(id)return Number(id[1]);
            const info=item.installmentInfo;
            return info?.startYear&&info?.startMonth?Date.UTC(Number(info.startYear),Number(info.startMonth)-1,1):0;
        };
        return items.map((item,index)=>({item,index,time:timestamp(item)})).sort((a,b)=>b.time-a.time||a.index-b.index).map(row=>row.item);
    }
    function createEditableSchedule(info){
        if(Array.isArray(info.schedule)&&info.schedule.length)return info.schedule.map(step=>({...step}));
        const months=Number(info.months),total=Number(info.total);
        if(!Number.isInteger(months)||months<1||!Number.isFinite(total)||total<0)throw Error('할부 계산 정보가 없습니다. 기존 항목 편집에서 시작월과 할부 개월을 먼저 설정해 주세요.');
        const interestMonths=info.type==='interest'?Array.from({length:months},(_,i)=>i+1):info.type==='partial-10'?[1,2,3,4,5]:info.type==='partial-12'?[1,2,3,4,5,6]:info.type==='partial-custom'?(info.customMonths||[]):[];
        let balance=total;const base=Math.floor(total/months);
        return Array.from({length:months},(_,index)=>{
            const principal=index===0?total-base*(months-1):base;
            const interest=interestMonths.includes(index+1)?Math.floor(balance*(Number(info.rate)||0)/100/12):0;
            balance-=principal;
            return {monthIndex:index+1,principal,interest,payment:principal+interest,balanceAfter:balance};
        });
    }
    function recalculateInstallmentSchedule(steps){
        if(!steps.length)throw Error('상환 내역이 없습니다.');
        const schedule=steps.map((step,index)=>{
            const principal=Number(step.principal),interest=Number(step.interest);
            if(!Number.isSafeInteger(principal)||!Number.isSafeInteger(interest)||principal<0||interest<0)throw Error(`${index+1}회차의 원금과 이자는 0 이상의 정수로 입력해 주세요.`);
            return {...step,monthIndex:index+1,principal,interest,payment:principal+interest};
        });
        const total=schedule.reduce((sum,step)=>sum+step.principal,0),totalInterest=schedule.reduce((sum,step)=>sum+step.interest,0);
        if(!Number.isSafeInteger(total+totalInterest))throw Error('입력 금액이 너무 큽니다.');
        let balance=total;schedule.forEach(step=>{balance-=step.principal;step.balanceAfter=balance;});
        return {schedule,total,totalInterest};
    }
    function installmentFingerprint(years,id){
        return JSON.stringify(Object.keys(years).sort().flatMap(year=>(years[year].details?.installment||[]).filter(item=>item.id===id).map(item=>[year,item.installmentInfo,item.values])));
    }
    function planInstallmentScheduleUpdate(years,source,info,steps){
        const result=recalculateInstallmentSchedule(steps),startYear=Number(info.startYear),startMonth=Number(info.startMonth);
        if(!Number.isInteger(startYear)||!Number.isInteger(startMonth)||startMonth<1||startMonth>12)throw Error('결제 시작월 정보가 올바르지 않습니다.');
        const yearly=new Map();
        result.schedule.forEach((step,index)=>{
            const offset=startMonth-1+index,year=String(startYear+Math.floor(offset/12));
            if(!yearly.has(year))yearly.set(year,Array(12).fill(0));
            yearly.get(year)[offset%12]+=step.payment;
        });
        Object.keys(years).forEach(year=>{if((years[year].details?.installment||[]).some(item=>item.id===source.id)&&!yearly.has(year))yearly.set(year,Array(12).fill(0));});
        return Array.from(yearly,([year,values])=>{
            const old=(years[year]?.details?.installment||[]).find(item=>item.id===source.id)||source;
            return {year,item:{...old,values,installmentInfo:{...old.installmentInfo,...info,months:result.schedule.length,total:result.total,totalInterest:result.totalInterest,schedule:result.schedule.map(step=>({...step}))}}};
        });
    }
    function dialog(){
        let popup=document.getElementById('installmentScheduleDialog');
        if(!popup){
            popup=document.createElement('dialog');popup.id='installmentScheduleDialog';popup.className='financial-editor-dialog';popup.setAttribute('aria-labelledby','installmentScheduleTitle');
            popup.addEventListener('close',()=>{draft=null;});
            popup.addEventListener('click',event=>{if(event.target!==popup)return;const b=popup.getBoundingClientRect();if(event.clientX<b.left||event.clientX>b.right||event.clientY<b.top||event.clientY>b.bottom)popup.close();});
            document.body.append(popup);
        }
        return popup;
    }
    function readInputs(popup){
        const steps=draft.schedule.map(step=>({...step}));
        popup.querySelectorAll('input[data-step]').forEach(input=>{
            if(input.value.trim()==='')throw Error('빈 금액은 0으로 입력해 주세요.');
            steps[Number(input.dataset.step)][input.dataset.field]=Number(input.value.replace(/,/g,''));
        });
        return recalculateInstallmentSchedule(steps);
    }
    function preview(popup){
        try{
            const result=readInputs(popup);
            result.schedule.forEach((step,index)=>{popup.querySelector(`[data-payment="${index}"]`).textContent=money(step.payment);popup.querySelector(`[data-balance="${index}"]`).textContent=money(step.balanceAfter);});
            popup.querySelector('#installmentScheduleTotals').textContent=`원금 ${money(result.total)}원 · 이자 ${money(result.totalInterest)}원 · 납부 합계 ${money(result.total+result.totalInterest)}원`;
            popup.querySelector('#installmentScheduleError').textContent='';
        }catch(error){popup.querySelector('#installmentScheduleError').textContent=error.message;}
    }
    function openInstallmentScheduleEditor(id){
        const source=(roadmapData.years[currentYear]?.details?.installment||[]).find(item=>item.id===id);
        if(!source?.installmentInfo){alert('할부 계산 정보가 없는 항목입니다. 기존 항목 편집에서 할부 정보를 먼저 설정해 주세요.');return;}
        try{
            const info={...source.installmentInfo};
            const schedule=createEditableSchedule(info);
            draft={id,source,info,schedule,fingerprint:installmentFingerprint(roadmapData.years,id)};
            const popup=dialog();
            const rows=schedule.map((step,index)=>{
                const offset=Number(info.startMonth)-1+index,year=Number(info.startYear)+Math.floor(offset/12),month=offset%12+1;
                return `<tr><th scope="row">${index+1}회 · ${year}-${String(month).padStart(2,'0')}</th><td><input type="number" min="0" step="1" data-step="${index}" data-field="principal" aria-label="${index+1}회차 원금" value="${escape(step.principal)}"></td><td><input type="number" min="0" step="1" data-step="${index}" data-field="interest" aria-label="${index+1}회차 이자" value="${escape(step.interest)}"></td><td data-payment="${index}">${money(step.payment)}</td><td data-balance="${index}">${money(step.balanceAfter)}</td></tr>`;
            }).join('');
            popup.innerHTML=`<header><div><h3 id="installmentScheduleTitle">${escape(source.name)} · 전체 원금/이자 수정</h3><p>카드사 청구액에 맞게 모든 회차를 수정한 뒤 한 번에 저장하세요.</p></div><button type="button" data-close>닫기</button></header><p id="installmentScheduleTotals"></p><p id="installmentScheduleError" role="alert"></p><div class="financial-editor-scroll"><table><thead><tr><th>회차·결제월</th><th>원금</th><th>이자</th><th>납부 합계</th><th>원금 잔액</th></tr></thead><tbody>${rows}</tbody></table></div><footer><p>저장 전에는 기존 데이터가 변경되지 않습니다. 저장하면 해당 항목의 연도별 납부 합계도 함께 반영됩니다.</p><button type="button" data-cancel>취소</button><button type="button" data-save>변경 사항 저장</button></footer>`;
            popup.querySelector('[data-close]').onclick=()=>popup.close();popup.querySelector('[data-cancel]').onclick=()=>popup.close();
            popup.querySelector('[data-save]').onclick=()=>saveInstallmentScheduleEditor();
            popup.oninput=()=>preview(popup);preview(popup);
            if(!popup.open)popup.showModal();popup.querySelector('[data-close]').focus();
        }catch(error){alert(error.message);}
    }
    function saveInstallmentScheduleEditor(){
        if(!draft)return;
        const popup=dialog();
        try{
            if(installmentFingerprint(roadmapData.years,draft.id)!==draft.fingerprint)throw Error('다른 화면이나 기기에서 이 항목이 변경됐습니다. 닫고 다시 열어 최신 내역을 확인해 주세요.');
            const result=readInputs(popup);
            const patches=planInstallmentScheduleUpdate(roadmapData.years,draft.source,draft.info,result.schedule);
            patches.forEach(({year,item})=>{
                if(!roadmapData.years[year])roadmapData.years[year]=roadmapData.createYearData();
                const data=roadmapData.years[year];if(!data.details)data.details={};if(!data.details.installment)data.details.installment=[];
                const index=data.details.installment.findIndex(old=>old.id===item.id);
                if(index<0)data.details.installment.push(item);else data.details.installment[index]=item;
            });
            const id=draft.id;saveData();popup.close();root.updateUI();
            if(root.lastDetailItemId===id&&typeof root.renderInstallmentDetails==='function')root.renderInstallmentDetails(id,root.lastDetailMonthIndex);
        }catch(error){popup.querySelector('#installmentScheduleError').textContent=error.message;}
    }
    root.sortInstallmentDisplay=sortInstallmentDisplay;
    root.escapeInstallmentHTML=escape;
    root.openInstallmentScheduleEditor=openInstallmentScheduleEditor;
    root.saveInstallmentScheduleEditor=saveInstallmentScheduleEditor;
    if(typeof document!=='undefined')document.addEventListener('click',event=>{
        const button=event.target.closest('button[data-installment-id]');
        if(button)openInstallmentScheduleEditor(button.dataset.installmentId);
    });
    if(typeof module!=='undefined'&&module.exports)module.exports={sortInstallmentDisplay,createEditableSchedule,recalculateInstallmentSchedule,planInstallmentScheduleUpdate,installmentFingerprint};
})(typeof window!=='undefined'?window:globalThis);
