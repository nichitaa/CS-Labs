import React, {useEffect, useState} from 'react';
import {Button, Col, Input, Row, Switch, Typography} from "antd";
import {CustomPolicyCard} from "./CustomPolicyCard";
import {objectClone, showMessage} from "../utils";
import {insertAuditDocument} from "../services/api";

const {Search} = Input;
const {Title} = Typography;


const CreateView = (props) => {

    const [auditContent, setAuditContent] = useState<object>({});
    const [newAuditDocumentName, setNewAuditDocumentName] = useState('');
    const [filteredCustomItems, setFilteredCustomItems] = useState<object[]>([]);
    const [initialCustomItems, setInitialCustomItems] = useState<object[]>([]);
    const [searchValue, setSearchValue] = useState('');

    useEffect(() => {
        const clone = objectClone(props.editViewItem);
        setAuditContent(clone);

        const temp: object[] = [];
        for (let el of clone.audit_custom_items) temp.push({...el, isActive: true});
        setFilteredCustomItems(temp);
        setInitialCustomItems(temp);
    }, [props.editViewItem]);

    const onSearchChange = (search) => {
        const searchString = search.toLowerCase();
        setSearchValue(prev => searchString);
        if (searchString.trim() === '') {
            setFilteredCustomItems(prev => initialCustomItems)
        } else {
            const temp: object[] = [];
            initialCustomItems.map(el => {
                let includes = false;
                for (let key in el) {
                    if (key !== 'isActive') {
                        const value = el[key].toLowerCase();
                        if (value.includes(searchString)) {
                            includes = true;
                        }
                    }
                }
                if(includes) temp.push(el)
                return el;
            });
            setFilteredCustomItems(prev => temp);
        }
    }

    const togglePolicyActiveState = (bool) => {
        const temp: object[] = [];
        for (let el of initialCustomItems) {
            temp.push({...el, isActive: bool})
        }
        setSearchValue(prev => '');
        setFilteredCustomItems(prev => temp);
        setInitialCustomItems(prev => temp);
    }

    const updateSinglePolicyActiveState = (bool, idx) => {
        let item = {}
        setFilteredCustomItems(prev => prev.map((el, index) => {
            if (idx === index) { // @ts-ignore
                el.isActive = bool;
                item = el;
            }
            return el;
        }))
        const areSameObjects = (obj1, obj2) => {
            return JSON.stringify(obj1) === JSON.stringify(obj2)
        }


        setInitialCustomItems(prev => prev.map(el => {
            if (areSameObjects(el, item)) {
                // @ts-ignore
                el.isActive = item.isActive
            }
            return el;
        }))
    }

    const saveCurrentConfiguration = () => {
        if (newAuditDocumentName.trim() === '') {
            showMessage('error', 'please enter new audit document name', 2);
        } else {
            const body = auditContent;
            const activePolicies = filteredCustomItems.filter(el => {
                // @ts-ignore
                if (el.isActive) return el;
            });
            body['audit_custom_items'] = [...activePolicies];
            body['audit_filename'] = newAuditDocumentName + '.audit';
            delete body['audit_file']
            console.log('current configuration: ', body);
            insertAuditDocument(body).then(res => {
                console.log('[insertAuditDocument] response: ', res);
                if (res.isSuccess) {
                    props.toggleIsEditView(false);
                    showMessage('success', 'new audit configuration successfully saved', 1);
                }
                else showMessage('error', res.error, 2);
            })
                .catch(err => console.log("error: ", err))
        }
    }

    const handleChangeAuditDocumentName = (e) => {
        if (e.target.value.trim().length === e.target.value.length) setNewAuditDocumentName(prev => e.target.value)
    }

    return (
        <div>
            <Row gutter={[8, 8]} style={{marginBottom: '10px'}}>
                <Col span={4}>
                    <Button danger={true} type={'dashed'} style={{width: '100%'}}
                            onClick={() => props.toggleIsEditView(false)}>{'< Back'}</Button>
                </Col>
                <Col style={{textAlign: 'center'}} offset={9} span={6}>
                    <Switch checkedChildren={'all policies active'}
                            unCheckedChildren={'all policies disabled'}
                            defaultChecked={true}
                            onChange={bool => togglePolicyActiveState(bool)}/>
                </Col>
                <Col span={5}>
                    <Button style={{width: '100%'}} onClick={saveCurrentConfiguration}>
                        Save
                    </Button>
                </Col>
            </Row>

            <Row style={{marginBottom: '10px'}} gutter={[8, 8]}>
                <Col span={12}>
                    <Input
                        placeholder={'Enter a new audit document name'}
                        value={newAuditDocumentName}
                        onChange={handleChangeAuditDocumentName}
                        onKeyDown={(e) => {
                            if(e.keyCode===13) saveCurrentConfiguration();
                        }}
                    />
                </Col>
                <Col span={12}>
                    <Search
                        placeholder="find a policy by a keyword"
                        allowClear
                        enterButton="Search"
                        size="middle"
                        value={searchValue}
                        onChange={(e) => onSearchChange(e.target.value)}
                        onSearch={(val) => onSearchChange(val)}
                    />
                </Col>
                <Title
                    style={{display: 'inline-block', color: '#645790', fontSize: '15px'}}
                    level={5}>
                    <code>found [{filteredCustomItems.length}] 📑 policies</code>
                </Title>
            </Row>

            <Row gutter={[8, 8]}>
                {filteredCustomItems.map((item, index) => {
                    return <Col key={index} span={filteredCustomItems.length === 1 ? 24 : 12}>
                        <CustomPolicyCard updateSinglePolicyActiveState={updateSinglePolicyActiveState} idx={index}
                                          policy={item}/>
                    </Col>
                })}
                {filteredCustomItems.length === 0
                && <p>Could not find any matching audit policy</p>}
            </Row>

        </div>
    );
};

export default CreateView;